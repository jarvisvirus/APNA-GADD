/* MOUNTAIN RUSH - Upgrade 1
   Canvas-only endless hill racer.
   No external assets required.
*/
"use strict";

const C = {
  W:1200,H:650,
  gravity:1650, maxSpeed:760, reverseMax:230,
  accel:610, reverseAccel:430, airTorque:5.8,
  groundGrip:0.985, airDrag:0.999,
  wheelR:18, wheelBase:68,
  bodyW:108, bodyH:45,
  suspensionK:105, suspensionD:15,
  fuelDrain:0.115, throttleFuel:0.72,
  nitroAccel:820, nitroMax:1030, nitroDrain:18, nitroRecharge:5.2,
  checkpoint:1000, particleMax:260, worldAhead:3600,
  cameraLead:330, cameraSmooth:6.5
};

const STATE={MENU:"MENU",PLAYING:"PLAYING",PAUSED:"PAUSED",CRASHED:"CRASHED",FINISHED:"FINISHED"};
let state=STATE.MENU;

const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d",{alpha:false});
canvas.width=C.W;canvas.height=C.H;

const $=id=>document.getElementById(id);
const UI={
  distance:$("distance"),score:$("score"),coins:$("coins"),fuelBar:$("fuelBar"),nitroBar:$("nitroBar"),
  nitroText:$("nitroText"),checkpoint:$("checkpointText"),stage:$("stageText"),best:$("bestText"),
  start:$("startScreen"),pause:$("pauseScreen"),crash:$("crashScreen"),startBtn:$("startButton"),
  restart:$("restartButton"),resume:$("resumeButton"),pauseBtn:$("pauseButton"),finalDistance:$("finalDistance"),
  finalCoins:$("finalCoins"),finalScore:$("finalScore"),finalStage:$("finalStage"),crashTitle:$("crashTitle"),
  crashMessage:$("crashMessage"),stageNote:$("stageNotification"),stageNumber:$("stageNumber"),toast:$("checkpointToast"),
  rpm:$("rpmNeedle"),speed:$("speedValue")
};

const input={gas:false,brake:false,left:false,right:false,nitro:false};

const keyMap={
  ArrowRight:"gas",d:"gas",D:"gas",ArrowUp:"gas",
  ArrowLeft:"brake",a:"brake",A:"brake",ArrowDown:"brake",
  w:"left",W:"left",s:"right",S:"right",
  " ":"nitro"
};
addEventListener("keydown",e=>{
  if(keyMap[e.key]){e.preventDefault();input[keyMap[e.key]]=true}
  if(e.key==="p"||e.key==="P"||e.key==="Escape"){e.preventDefault();togglePause()}
  if(e.key==="r"||e.key==="R"){if(state===STATE.CRASHED||state===STATE.FINISHED){e.preventDefault();startGame()}}
},{passive:false});
addEventListener("keyup",e=>{if(keyMap[e.key]){e.preventDefault();input[keyMap[e.key]]=false}},{passive:false});

function bindTouch(id,prop){
  const el=$(id); if(!el)return;
  const down=e=>{e.preventDefault();input[prop]=true;el.classList.add("active");try{el.setPointerCapture(e.pointerId)}catch{}};
  const up=e=>{e.preventDefault();input[prop]=false;el.classList.remove("active")};
  ["pointerdown"].forEach(t=>el.addEventListener(t,down,{passive:false}));
  ["pointerup","pointercancel","pointerleave","lostpointercapture"].forEach(t=>el.addEventListener(t,up,{passive:false}));
}
bindTouch("leftTouch","brake");bindTouch("rightTouch","gas");bindTouch("nitroTouch","nitro");

let audio=null;
const AudioSystem={
  init(){
    if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audio=new AC()}
    if(audio?.state==="suspended")audio.resume();
  },
  tone(f,d=.1,type="sine",v=.035){
    if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(v,audio.currentTime+.01);
    g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d+.02);
  },
  coin(){this.tone(880,.07,"square",.035);setTimeout(()=>this.tone(1240,.09,"square",.028),45)},
  fuel(){this.tone(480,.09,"sine",.04);setTimeout(()=>this.tone(720,.12,"sine",.03),70)},
  checkpoint(){this.tone(620,.09,"triangle",.04);setTimeout(()=>this.tone(920,.16,"triangle",.035),90)},
  nitro(){this.tone(120,.28,"sawtooth",.025)},
  crash(){this.tone(85,.32,"sawtooth",.065)},
  finish(){[680,860,1080].forEach((f,i)=>setTimeout(()=>this.tone(f,.13,"triangle",.04),i*100))}
};

let distance=0,score=0,coins=0,fuel=100,nitro=100,stage=1,nextCheckpoint=1000,lastCheckpoint=0;
let cameraX=0,cameraY=0,targetCameraX=0,targetCameraY=0,shake=0,worldTime=0;
let generatedUntil=0,toastTimer=0,stageTimer=0,finishDistance=Infinity;
let best=Number(localStorage.getItem("mountainRushBestDistance")||0);

const car={
  x:220,y:0,vx:0,vy:0,rotation:0,angularVelocity:0,wheelRotation:0,
  grounded:false,wasGrounded:false,groundContacts:0,suspension:0,nitroActive:false,
  airTime:0,impactCooldown:0
};

const coinsList=[],fuelList=[],scenery=[],checkpoints=[],particles=[];

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function terrainHeight(x){
  const d=Math.max(0,(x-300)/1800);
  const difficulty=1+Math.min(stage*.045,.65);
  const broad=Math.sin(x*.00245)*58*difficulty;
  const rolling=Math.sin(x*.0053+1.2)*29*difficulty;
  const small=Math.sin(x*.0105)*12;
  const micro=Math.sin(x*.019)*4;
  return 474-broad-rolling-small-micro;
}
function terrainSlope(x){
  const dx=3;
  return (terrainHeight(x+dx)-terrainHeight(x-dx))/(dx*2);
}
function terrainAngle(x){return Math.atan(terrainSlope(x))}

function resetWorld(){
  coinsList.length=0;fuelList.length=0;scenery.length=0;checkpoints.length=0;particles.length=0;
  generatedUntil=0;
}
function ensureWorld(){
  const needed=car.x+C.worldAhead;
  if(generatedUntil>=needed)return;
  let x=Math.max(300,generatedUntil);
  const step=115;
  while(x<needed){
    const y=terrainHeight(x),r=Math.random();
    if(r<.55){
      const pattern=Math.random();
      if(pattern<.72){
        coinsList.push({x,y:y-58-Math.random()*18,phase:Math.random()*6.28,rot:Math.random()*6.28,collected:false});
        if(Math.random()<.4)coinsList.push({x:x+34,y:y-78,phase:Math.random()*6.28,rot:0,collected:false});
      }else{
        fuelList.push({x,y:y-70,phase:Math.random()*6.28,collected:false});
      }
    }
    if(r>.18){
      scenery.push({type:"tree",x:x+25,y,scale:.65+Math.random()*.65});
      if(Math.random()<.28)scenery.push({type:"rock",x:x-20,y,scale:.55+Math.random()*.7});
    }
    const m=Math.floor((x-200)/10);
    if(m>0 && m%1000===0)checkpoints.push({x,triggered:false,m});
    x+=step+Math.random()*70;
  }
  generatedUntil=x;
}

function spawn(p){
  if(particles.length>=C.particleMax)return;
  p.maxLife=p.life;
  particles.push(p);
}
function burst(x,y,n,type){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=35+Math.random()*210;
    spawn({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.55,size:2+Math.random()*5,gravity:type==="dust"?70:360,type,rot:Math.random()*6.28,spin:(Math.random()-.5)*8});
  }
}
function dust(){
  spawn({x:car.x-35,y:terrainHeight(car.x)-2,vx:-25-Math.random()*70,vy:-25-Math.random()*35,life:.25+Math.random()*.25,size:4+Math.random()*6,gravity:-10,type:"dust",rot:0,spin:0});
}
function nitroTrail(){
  if(Math.random()>.42)return;
  spawn({x:car.x-52,y:car.y+12,vx:-100-Math.random()*180,vy:(Math.random()-.5)*55,life:.18+Math.random()*.2,size:3+Math.random()*5,gravity:-15,type:"nitro",rot:0,spin:0});
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.life-=dt;
    if(p.life<=0){particles.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=Math.pow(.985,dt*60);p.rot+=p.spin*dt;
  }
}

function updateCar(dt){
  car.wasGrounded=car.grounded;
  car.impactCooldown=Math.max(0,car.impactCooldown-dt);

  const throttle=input.gas&&fuel>0;
  const brake=input.brake;
  const angle=terrainAngle(car.x);
  const uphillResistance=Math.sin(angle)*210;

  if(throttle){
    const power=C.accel*(1-Math.min(Math.abs(car.vx)/C.maxSpeed,.86)*.28);
    car.vx+=power*dt;
    fuel-=C.throttleFuel*dt;
  }
  if(brake){
    if(car.vx>18) car.vx-=760*dt;
    else car.vx-=C.reverseAccel*dt;
    fuel-=.28*dt;
  }
  if(car.grounded)car.vx-=uphillResistance*dt;

  car.nitroActive=input.nitro&&nitro>0&&car.vx>45&&fuel>0;
  if(car.nitroActive){
    car.vx+=C.nitroAccel*dt;nitro-=C.nitroDrain*dt;fuel-=.22*dt;nitroTrail();
  }else nitro+=C.nitroRecharge*dt;
  nitro=clamp(nitro,0,100);fuel=clamp(fuel,0,100);

  if(!throttle&&!brake&&car.grounded)car.vx*=Math.pow(C.groundGrip,dt*60);
  car.vx=clamp(car.vx,-C.reverseMax,car.nitroActive?C.nitroMax:C.maxSpeed);

  car.vy+=C.gravity*dt;
  car.x+=car.vx*dt;car.y+=car.vy*dt;
  car.wheelRotation+=(car.vx/C.wheelR)*dt;

  const half=C.wheelBase/2, rearX=car.x-half,frontX=car.x+half;
  const rearGround=terrainHeight(rearX),frontGround=terrainHeight(frontX);
  const wheelY=car.y+27;
  const deepest=Math.max(wheelY-rearGround,wheelY-frontGround);
  car.grounded=deepest>=0;

  if(car.grounded){
    const desiredY=Math.min(rearGround,frontGround)-27;
    const compression=desiredY-car.y;
    car.suspension=lerp(car.suspension,clamp(compression,-12,20),clamp(dt*18,0,1));
    car.y=lerp(car.y,desiredY,clamp(dt*C.suspensionK/14,0,1));
    car.vy*=Math.pow(.16,dt*8);

    const targetAngle=Math.atan2(rearGround-frontGround,C.wheelBase);
    const diff=norm(targetAngle-car.rotation);
    car.angularVelocity+=diff*C.suspensionK*.055*dt;
    car.angularVelocity*=Math.pow(.18,dt*7);
    car.rotation+=car.angularVelocity*dt;

    if(!car.wasGrounded){
      if(Math.abs(car.vy)>120 || Math.abs(norm(car.rotation-targetAngle))>.42){
        burst(car.x,car.y+28,13,"dust");shake=Math.max(shake,3.5);
        if(Math.abs(car.angularVelocity)>4.8 || Math.abs(norm(car.rotation-targetAngle))>1.45)crash("HARD LANDING");
      }
      car.airTime=0;
    }
    if(Math.abs(car.vx)>110&&Math.random()<dt*10)dust();
  }else{
    car.airTime+=dt;
    const torque=(input.left?-1:0)+(input.right?1:0);
    car.angularVelocity+=torque*C.airTorque*dt;
    car.angularVelocity*=Math.pow(C.airDrag,dt*60);
    car.rotation+=car.angularVelocity*dt;
  }

  const rot=Math.abs(norm(car.rotation));
  if(!car.grounded && rot>2.78 && car.airTime>.22){crash("CAR FLIPPED");return}
  if(car.grounded && rot>1.65 && Math.abs(car.vx)>95){crash("BAD BALANCE");return}
  if(car.y>900){crash("FELL OFF TRACK");return}

  if(fuel<=0){crash("OUT OF FUEL");return}

  distance=Math.max(distance,(car.x-220)/10);
  score=Math.floor(distance*2+coins*100);
  checkPickups();checkCheckpoints();ensureWorld();

  if(car.x<120){car.x=120;car.vx=Math.max(0,car.vx)}
}

function checkPickups(){
  for(const c of coinsList){
    if(c.collected||Math.abs(c.x-car.x)>130)continue;
    const y=c.y+Math.sin(worldTime*4+c.phase)*7;
    if(Math.hypot(car.x-c.x,car.y-y)<58){
      c.collected=true;coins++;score+=100;burst(c.x,y,12,"coin");AudioSystem.coin();
    }
  }
  for(const f of fuelList){
    if(f.collected||Math.abs(f.x-car.x)>140)continue;
    const y=f.y+Math.sin(worldTime*3+f.phase)*6;
    if(Math.hypot(car.x-f.x,car.y-y)<62){
      f.collected=true;fuel=clamp(fuel+32,0,100);burst(f.x,y,16,"fuel");AudioSystem.fuel();
    }
  }
}
function checkCheckpoints(){
  for(const cp of checkpoints){
    if(cp.triggered||car.x<cp.x)continue;
    cp.triggered=true;lastCheckpoint=cp.m;nextCheckpoint=cp.m+1000;
    fuel=clamp(fuel+8,0,100);nitro=clamp(nitro+18,0,100);
    toastTimer=2;shake=Math.max(shake,2.5);burst(car.x,terrainHeight(car.x)-55,20,"coin");AudioSystem.checkpoint();
  }
  const newStage=distance<5000?1:distance<10000?2:distance<20000?3:Math.floor(distance/10000)+1;
  if(newStage>stage){
    stage=newStage;stageTimer=2.6;UI.stageNumber.textContent=`STAGE ${stage}`;UI.stageNote.classList.remove("hidden");
    burst(car.x,terrainHeight(car.x)-65,30,"coin");AudioSystem.finish();shake=Math.max(shake,4);
    setTimeout(()=>{if(state===STATE.PLAYING)UI.stageNote.classList.add("hidden")},2600);
  }
}

function crash(reason){
  if(state===STATE.CRASHED)return;
  state=STATE.CRASHED;input.gas=input.brake=input.left=input.right=input.nitro=false;car.nitroActive=false;
  shake=12;burst(car.x,car.y,34,"spark");burst(car.x,terrainHeight(car.x),25,"dust");AudioSystem.crash();
  if(distance>best){best=Math.floor(distance);localStorage.setItem("mountainRushBestDistance",best)}
  UI.finalDistance.textContent=Math.floor(distance);UI.finalCoins.textContent=coins;UI.finalScore.textContent=Math.floor(score);UI.finalStage.textContent=stage;
  UI.crashTitle.textContent=reason==="OUT OF FUEL"?"OUT OF FUEL":"CRASH!";
  UI.crashMessage.textContent=reason==="CAR FLIPPED"?"The car rotated too far. Use air control to recover.":reason==="BAD BALANCE"?"Too much tilt on the landing.":reason==="OUT OF FUEL"?"Find fuel pickups to keep going.":"Control the car and try again.";
  setTimeout(()=>{if(state===STATE.CRASHED)UI.crash.classList.remove("hidden")},300);
}

function togglePause(){
  if(state===STATE.PLAYING){state=STATE.PAUSED;UI.pause.classList.remove("hidden")}
  else if(state===STATE.PAUSED){state=STATE.PLAYING;UI.pause.classList.add("hidden");lastTime=performance.now()}
}
function startGame(){
  AudioSystem.init();state=STATE.MENU;UI.crash.classList.add("hidden");UI.pause.classList.add("hidden");UI.stageNote.classList.add("hidden");UI.start.classList.add("hidden");
  distance=0;score=0;coins=0;fuel=100;nitro=100;stage=1;nextCheckpoint=1000;lastCheckpoint=0;cameraX=0;cameraY=0;shake=0;worldTime=0;toastTimer=0;stageTimer=0;
  resetWorld();car.x=220;car.y=terrainHeight(car.x)-27;car.vx=0;car.vy=0;car.rotation=0;car.angularVelocity=0;car.wheelRotation=0;car.grounded=false;car.airTime=0;car.nitroActive=false;
  ensureWorld();state=STATE.PLAYING;lastTime=performance.now();updateUI();
}
function resetMenu(){UI.start.classList.remove("hidden");UI.crash.classList.add("hidden");UI.pause.classList.add("hidden")}
UI.startBtn.addEventListener("click",startGame);UI.restart.addEventListener("click",startGame);UI.resume.addEventListener("click",togglePause);UI.pauseBtn.addEventListener("click",togglePause);

function updateCamera(dt){
  targetCameraX=Math.max(0,car.x-C.cameraLead);
  targetCameraY=terrainHeight(car.x)-390;
  cameraX=lerp(cameraX,targetCameraX,clamp(dt*C.cameraSmoothness,0,1));
  cameraY=lerp(cameraY,targetCameraY,clamp(dt*4.5,0,1));
}
function updateUI(){
  UI.distance.textContent=Math.floor(distance);UI.score.textContent=Math.floor(score);UI.coins.textContent=coins;
  UI.fuelBar.style.width=`${fuel}%`;UI.nitroBar.style.width=`${nitro}%`;
  UI.nitroText.textContent=car.nitroActive?"BOOST!":nitro>98?"READY":"CHARGING";
  UI.checkpoint.textContent=`${nextCheckpoint} m`;UI.stage.textContent=stage;UI.best.textContent=`${Math.floor(best)} m`;
  UI.fuelBar.style.opacity=fuel<22?".72":"1";
  const kmh=Math.round(Math.abs(car.vx)*.16),rpm=clamp((Math.abs(car.vx)/C.maxSpeed)*.92+(input.gas?.08:0),0,1);
  UI.speed.textContent=kmh;UI.rpm.style.transform=`rotate(${-55+rpm*110}deg)`;
  if(toastTimer<=0)UI.toast.classList.add("hidden");else UI.toast.classList.remove("hidden");
}

function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,C.H);g.addColorStop(0,"#59bff0");g.addColorStop(.58,"#a7e6f7");g.addColorStop(1,"#d8f1d4");ctx.fillStyle=g;ctx.fillRect(0,0,C.W,C.H);
  ctx.fillStyle="rgba(255,245,185,.9)";ctx.beginPath();ctx.arc(1010,92,42,0,Math.PI*2);ctx.fill();
}
function cloud(x,y,s){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="rgba(255,255,255,.78)";
  [[0,0,25],[25,-8,30],[55,2,23],[42,10,30]].forEach(a=>{ctx.beginPath();ctx.arc(a[0],a[1],a[2],0,Math.PI*2);ctx.fill()});ctx.restore();
}
function drawClouds(){
  const clouds=[[120,100,1],[470,155,.72],[830,92,1.15],[1260,135,.82],[1660,78,.95]];
  for(const c of clouds){let x=((c[0]-cameraX*.12)%(C.W+500)+(C.W+500))%(C.W+500)-100;cloud(x,c[1],c[2])}
}
function mountains(parallax,base,amp,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,C.H);
  for(let x=0;x<=C.W;x+=20){const wx=x+cameraX*parallax;const y=base-Math.abs(Math.sin(wx*.0022))*amp-Math.abs(Math.sin(wx*.0048+2))*amp*.42;ctx.lineTo(x,y)}
  ctx.lineTo(C.W,C.H);ctx.closePath();ctx.fill();
}
function drawTerrain(){
  ctx.save();ctx.translate(-cameraX,-cameraY);
  const start=Math.floor(cameraX/8)*8,end=cameraX+C.W+10;
  ctx.beginPath();ctx.moveTo(start,C.H+cameraY);
  for(let x=start;x<=end;x+=8)ctx.lineTo(x,terrainHeight(x));
  ctx.lineTo(end,C.H+cameraY);ctx.closePath();ctx.fillStyle="#8f5d35";ctx.fill();
  ctx.globalAlpha=.25;ctx.fillStyle="#e6ad6a";ctx.beginPath();ctx.moveTo(start,C.H+cameraY);
  for(let x=start;x<=end;x+=18)ctx.lineTo(x,terrainHeight(x)+35);ctx.lineTo(end,C.H+cameraY);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.beginPath();for(let x=start;x<=end;x+=8){const y=terrainHeight(x);if(x===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle="#4c9c42";ctx.lineWidth=9;ctx.stroke();
  ctx.strokeStyle="#83d05c";ctx.lineWidth=3;ctx.stroke();
  ctx.restore();
}
function drawScenery(){
  for(const o of scenery){const sx=o.x-cameraX,sy=o.y-cameraY;if(sx<-100||sx>C.W+100)continue;ctx.save();ctx.translate(sx,sy);ctx.scale(o.scale,o.scale);
    if(o.type==="tree"){ctx.fillStyle="#6a4229";ctx.fillRect(-6,-50,12,50);ctx.fillStyle="#2e8441";ctx.beginPath();ctx.arc(0,-62,25,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-18,-45,20,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(17,-44,20,0,Math.PI*2);ctx.fill()}
    else{ctx.fillStyle="#6f7377";ctx.beginPath();ctx.ellipse(0,-8,22,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9ca2a5";ctx.beginPath();ctx.ellipse(-7,-13,10,7,0,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
}
function drawCoins(){
  for(const c of coinsList){if(c.collected)continue;const x=c.x-cameraX,y=c.y+Math.sin(worldTime*4+c.phase)*7-cameraY;if(x<-50||x>C.W+50)continue;const spin=Math.abs(Math.cos(worldTime*7+c.rot));ctx.save();ctx.translate(x,y);ctx.scale(.35+.65*spin,1);ctx.fillStyle="#ffd64d";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff1a2";ctx.lineWidth=2;ctx.stroke();ctx.restore()}
}
function drawFuel(){
  for(const f of fuelList){if(f.collected)continue;const x=f.x-cameraX,y=f.y+Math.sin(worldTime*3+f.phase)*6-cameraY;if(x<-60||x>C.W+60)continue;ctx.save();ctx.translate(x,y);ctx.shadowBlur=14;ctx.shadowColor="#62ee7c";ctx.fillStyle="#55d96e";ctx.fillRect(-13,-18,26,36);ctx.fillStyle="#eaffee";ctx.fillRect(4,-14,5,10);ctx.fillStyle="#fff";ctx.font="bold 12px Arial";ctx.textAlign="center";ctx.fillText("F",0,5);ctx.restore()}
}
function drawCheckpoints(){
  for(const cp of checkpoints){const x=cp.x-cameraX;if(x<-30||x>C.W+30)continue;const y=terrainHeight(cp.x)-cameraY;ctx.save();ctx.strokeStyle=cp.triggered?"rgba(120,255,150,.4)":"rgba(255,220,90,.9)";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-100);ctx.stroke();ctx.fillStyle=cp.triggered?"#72df8a":"#ffd34f";ctx.fillRect(x,y-100,70,27);ctx.fillStyle="#1d2a36";ctx.font="bold 12px Arial";ctx.fillText(`${cp.m}m`,x+8,y-81);ctx.restore()}
}
function drawParticles(){
  for(const p of particles){const x=p.x-cameraX,y=p.y-cameraY;if(x<-60||x>C.W+60||y<-60||y>C.H+60)continue;const a=clamp(p.life/p.maxLife,0,1);ctx.save();ctx.globalAlpha=a;
    if(p.type==="dust"){ctx.fillStyle="#d0ad7b";ctx.beginPath();ctx.arc(x,y,p.size*(1+(1-a)),0,Math.PI*2);ctx.fill()}
    else if(p.type==="coin"){ctx.fillStyle="#ffe06a";ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff6a8";ctx.fillRect(x-1,y-p.size*.6,2,p.size*1.2)}
    else if(p.type==="fuel"){ctx.fillStyle="#69ee82";ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill()}
    else if(p.type==="nitro"){ctx.fillStyle="#72dfff";ctx.shadowBlur=10;ctx.shadowColor="#55cfff";ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill()}
    else{ctx.strokeStyle="#ffe46b";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-p.vx*.035,y-p.vy*.035);ctx.stroke()}
    ctx.restore();
  }
}
function wheel(x,y){
  ctx.save();ctx.translate(x,y);ctx.rotate(car.wheelRotation);ctx.fillStyle="#202326";ctx.beginPath();ctx.arc(0,0,C.wheelR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#0b0c0d";ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle="#aeb7be";ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#5e6870";ctx.lineWidth=2;
  for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*8,Math.sin(a)*8);ctx.stroke()}ctx.restore();
}
function drawCar(){
  const sx=car.x-cameraX,sy=car.y-cameraY;ctx.save();ctx.translate(sx,sy);ctx.rotate(car.rotation);
  if(car.nitroActive){ctx.fillStyle="rgba(100,220,255,.7)";ctx.beginPath();ctx.moveTo(-53,8);ctx.lineTo(-105,18);ctx.lineTo(-57,2);ctx.closePath();ctx.fill()}
  ctx.fillStyle="#d94141";ctx.beginPath();ctx.roundRect(-54,-24,108,40,10);ctx.fill();ctx.fillStyle="#f15b4f";ctx.beginPath();ctx.moveTo(-20,-24);ctx.lineTo(-4,-42);ctx.lineTo(25,-42);ctx.lineTo(39,-24);ctx.closePath();ctx.fill();
  ctx.fillStyle="#bde6f2";ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(22,-38);ctx.lineTo(33,-25);ctx.lineTo(4,-25);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-13,-38);ctx.lineTo(0,-38);ctx.lineTo(1,-25);ctx.lineTo(-25,-25);ctx.closePath();ctx.fill();
  ctx.fillStyle="#34383d";ctx.fillRect(40,7,16,7);ctx.fillStyle="#fff1a8";ctx.beginPath();ctx.arc(49,-3,5,0,Math.PI*2);ctx.fill();
  wheel(-34,18);wheel(34,18);ctx.restore();
}
function drawSpeedLines(){
  if(Math.abs(car.vx)<430&&!car.nitroActive)return;const intensity=clamp(Math.abs(car.vx)/1000,0,1);ctx.save();ctx.globalAlpha=.12+intensity*.22;ctx.strokeStyle="#fff";ctx.lineWidth=2;
  for(let i=0;i<10;i++){const y=85+i*48,o=(worldTime*(280+intensity*250)+i*120)%150,l=20+intensity*70;ctx.beginPath();ctx.moveTo(C.W-o,y);ctx.lineTo(C.W-o-l,y);ctx.stroke()}ctx.restore();
}
function draw(){
  ctx.save();if(shake>.1)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawSky();drawClouds();mountains(.13,390,85,"#8bb5b0");mountains(.28,435,70,"#6e9d8e");drawTerrain();drawScenery();drawCheckpoints();drawCoins();drawFuel();drawParticles();drawCar();drawSpeedLines();ctx.restore();
}

let lastTime=performance.now();
function update(dt){
  worldTime+=dt;
  if(state===STATE.PLAYING){updateCar(dt);updateCamera(dt)}
  updateParticles(dt);toastTimer=Math.max(0,toastTimer-dt);stageTimer=Math.max(0,stageTimer-dt);shake=Math.max(0,shake-dt*8);updateUI();
}
function loop(t){let dt=clamp((t-lastTime)/1000,0,.033);lastTime=t;update(dt);draw();requestAnimationFrame(loop)}
resetWorld();car.y=terrainHeight(car.x)-27;ensureWorld();updateUI();resetMenu();requestAnimationFrame(loop);

document.addEventListener("visibilitychange",()=>{if(document.hidden&&state===STATE.PLAYING)togglePause()});
document.addEventListener("touchmove",e=>{if(e.target.closest(".game-area"))e.preventDefault()},{passive:false});
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
