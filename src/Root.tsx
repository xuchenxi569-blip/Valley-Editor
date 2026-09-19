import React from 'react';
import {AbsoluteFill, Audio, Composition, interpolate, staticFile, useCurrentFrame} from 'remotion';
import content from '../content.json';

const ink='#54301b';
type EditorProps={
 season?:string;
 day?:string|number;
 weather?:string;
 taskTexts?:string[];
 bonusText?:string;
 bambooText?:string;
};
const PixelScene=()=>{const f=useCurrentFrame();return <svg viewBox="0 0 360 640" width="1080" height="1920" style={{position:'absolute',inset:0}} shapeRendering="crispEdges">
 <rect width="360" height="640" fill="#78bfe5"/>
 <rect y="438" width="360" height="202" fill="#50892f"/>
 {Array.from({length:42},(_,i)=><rect key={i} x={(i*73)%360} y={(i*47)%435} width={i%3===0?6:3} height="3" fill={i%2?'#9bd4ed':'#88c9e7'}/>)}
 {[[-32,42],[222,20],[288,123],[28,332]].map(([x,y],i)=><g key={i} transform={`translate(${x+Math.floor(Math.sin(f/65+i)*3)},${y})`} fill="#fff6d4"><rect x="12" y="0" width="43" height="10"/><rect x="0" y="10" width="78" height="12"/><rect x="12" y="22" width="55" height="5"/></g>)}
 <path d="M0 438H24V426H60V432H84V420H116V431H146V422H177V436H215V427H249V418H287V430H324V421H360V480H0Z" fill="#79b343"/>
 <path d="M0 456H34V447H72V454H110V441H136V453H171V446H205V455H237V438H263V450H301V443H333V449H360V480H0Z" fill="#50892f"/>
 {Array.from({length:30},(_,i)=><g key={i} transform={`translate(${(i*47)%360},${450+(i*13)%28})`}><rect width="3" height="12" fill="#35632d"/><rect x="-3" y="4" width="9" height="3" fill="#9dce55"/>{i%3===0&&<><rect x="-3" y="-3" width="9" height="3" fill="#f8d5be"/><rect y="-6" width="3" height="9" fill="#ffe5a0"/></>}</g>)}
<g>{[0,310].map((x,i)=><g key={i} transform={`translate(${x},325)`}><rect x="18" y="25" width="10" height="95" fill="#785027"/><path d="M17 0H30V10H40V20H47V42H38V52H8V43H0V20H8V10H17Z" fill="#397335"/><path d="M17 5H29V15H38V31H30V40H9V30H5V20H17Z" fill="#6ca340"/></g>)}</g><g transform="translate(0,445)">{Array.from({length:15},(_,i)=><g key={i} transform={`translate(${i*26},0)`}><rect width="5" height="25" fill="#8c532b"/><rect width="3" height="23" fill="#dba35a"/><rect y="6" width="26" height="4" fill="#c48b49"/><rect y="17" width="26" height="4" fill="#c48b49"/></g>)}</g></svg>};
const Spark=({x,y,delay=0}:{x:number,y:number,delay?:number})=>{const f=useCurrentFrame();return <svg width="54" height="72" viewBox="0 0 18 24" style={{position:'absolute',left:x,top:y,opacity:Math.floor((f+delay)/14)%3===0?.45:1}} shapeRendering="crispEdges"><path d="M7 0H11V8H15V12H18V16H11V24H7V16H0V12H4V8H7Z" fill="#fff1a3"/><rect x="7" y="9" width="4" height="7" fill="#fffbe0"/></svg>};
const categoryStyle=(category?:string)=>{if(category==='耕种')return{color:'#48743b',icon:'◆'};if(category==='社交')return{color:'#ab5261',icon:'♥'};if(category==='宠物')return{color:'#7a5230',icon:'♦'};return{color:'#567e8b',icon:'◆'};};
const Task=({points,text,start,category}:{points:string,text:string,start:number,category?:string})=>{const f=useCurrentFrame();const a=interpolate(f,[start,start+7],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});const cat=categoryStyle(category);return <div style={{height:116,display:'flex',alignItems:'center',gap:25,opacity:a,transform:`translateY(${Math.round((1-a)*18)}px)`}}><div style={{width:99,height:65,flexShrink:0,background:'#ffcf55',border:'5px solid #965020',boxShadow:'5px 5px 0 #bd8037',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:35,fontWeight:900,color:'#6e3819'}}>{points}</div><div style={{display:'flex',flexDirection:'column',gap:7}}>{category&&<span style={{fontSize:25,fontWeight:900,color:cat.color,letterSpacing:3}}>{cat.icon} {category}</span>}<span style={{fontSize:37,fontWeight:900,lineHeight:1.05,letterSpacing:1,whiteSpace:'pre-line'}}>{text}</span></div></div>};
const Panel=({top,height,title,children}:{top:number,height:number,title:string,children:React.ReactNode})=><div style={{position:'absolute',left:62,top,width:956,height,background:'repeating-linear-gradient(0deg,#ffe6ae 0px,#ffe6ae 5px,#ffe3a6 5px,#ffe3a6 6px)',border:'12px solid #9c5426',outline:'6px solid #542b17',boxShadow:'0 12px 0 #542b17, inset 0 0 0 6px #efb766, inset 0 0 0 10px #be7d3c',padding:'23px 35px',boxSizing:'border-box'}}><div style={{fontSize:39,fontWeight:900,color:'#783819',textShadow:'2px 2px #ffc77b',borderBottom:'3px solid #d7ae69',paddingBottom:13,marginBottom:7}}>{title}</div>{children}</div>;
export const DailyQuest=(props:EditorProps)=>{const f=useCurrentFrame();const season=props.season??content.season??'秋季';const day=props.day??content.day;const weather=props.weather??content.weather??'晴';const tasks=content.tasks.map((task,i)=>({...task,text:props.taskTexts?.[i]??(i===1&&props.bambooText?props.bambooText:task.text)}));const bonus={...content.bonus,text:props.bonusText??content.bonus.text};return <AbsoluteFill style={{fontFamily:'"Microsoft YaHei", sans-serif',color:ink,overflow:'hidden'}}><PixelScene/><Audio src={staticFile('chimes.wav')} volume={.6}/><Spark x={71} y={154}/><Spark x={947} y={219} delay={12}/><Spark x={943} y={114} delay={24}/>
 <div style={{position:'absolute',top:167,width:'100%',textAlign:'center',fontSize:103,lineHeight:1.15,fontWeight:1000,letterSpacing:4,color:'#ffcf6b',WebkitTextStroke:'3px #ffe9b0',paintOrder:'stroke fill',textShadow:'0 8px 0 #71371c, 7px 0 #ffe9b0, -7px 0 #ffe9b0, 0 -7px #ffe9b0',transform:`translateY(${f<8?(8-f)*-2:0}px)`}}>今日农场委托</div>
 <div style={{position:'absolute',top:322,width:'100%',textAlign:'center',fontFamily:'monospace',fontWeight:900,fontSize:48,letterSpacing:5,color:'#573821',textShadow:'3px 3px #fffce8'}}>{season} · 第 {day} 天 · {weather}</div>
 <Panel top={430} height={542} title={content.tasksPanelTitle ?? '信箱'}>{tasks.map((t,i)=><Task key={i} {...t} start={17+i*21}/>)}</Panel>
 <Panel top={1050} height={250} title="特别委托"><Task {...bonus} start={83}/></Panel>
 <div style={{position:'absolute',top:1590,width:'100%',padding:'0 50px',boxSizing:'border-box',textAlign:'center',fontSize:42,lineHeight:1.35,fontWeight:900,opacity:f>=106?1:0,textShadow:'1px 1px #eaf3de'}}>{content.message}</div>
 <div style={{position:'absolute',bottom:45,width:'100%',textAlign:'center',fontSize:19,fontWeight:700,letterSpacing:4,color:'#f6f6d9'}}>农场日记 · 每天都有小小收获</div>
 </AbsoluteFill>};
export const Root=()=> <>
 <Composition id="DailyQuest" component={DailyQuest} durationInFrames={186} fps={30} width={1080} height={1920}/>
 <Composition id="DailyQuestBamboo" component={DailyQuest} durationInFrames={186} fps={30} width={1080} height={1920} defaultProps={{bambooText:'采集19根竹子，\n为后续的种植做准备'}}/>
</>;
