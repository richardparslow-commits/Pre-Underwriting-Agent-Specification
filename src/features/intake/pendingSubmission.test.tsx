import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import IntakePage from "@/pages/IntakePage";
import { useInterview, type IntakeStep } from "@/features/interview/useInterview";
import { IntakeSessionContext } from "@/features/interview/intakeSessionContext";
import { ReviewScreen } from "./ReviewScreen";
const text=(node:ReactTestInstance|string):string=>typeof node==='string'?node:node.children.map(text).join('');

test('pending intake replaces every history-selected form with an accessible waiting state',async()=>{
 function Harness({step}:{step:IntakeStep}) {
  const interview=useInterview();
  return <MemoryRouter><IntakeSessionContext.Provider value={{interview:{...interview,step},submitting:true,navigationBlocked:false,error:null,submit:async()=>{},historyEntry:{session:'synthetic',step}}}><IntakePage/></IntakeSessionContext.Provider></MemoryRouter>;
 }
 const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 if(!originalWindow)Object.defineProperty(globalThis,'window',{configurable:true,value:{scrollTo(){}}});
 let view!:ReactTestRenderer;
 try {
  await act(async()=>{view=create(<Harness step='lead'/>);});
  for(const step of ['lead','permission','interview','review'] as const) {
   await act(async()=>view.update(<Harness step={step}/>));
   const status=view.root.findAll(node=>node.props.role==='status');assert.equal(status.length,1);
   assert.match(text(status[0]!),/Submitting your reviewed answers/);
   assert.equal(view.root.findAllByType('input').length,0);assert.equal(view.root.findAllByType('textarea').length,0);
   assert.equal(view.root.findAllByType('button').length,0);
  }
 } finally {await act(async()=>view.unmount());if(!originalWindow)Reflect.deleteProperty(globalThis,'window');}
});

test('all review edit paths are disabled during submission',async()=>{
 const noop=()=>{};let view!:ReactTestRenderer;
 await act(async()=>{view=create(<MemoryRouter><ReviewScreen lead={{firstName:'Synthetic',lastName:'Pending',state:'TX',email:'pending@example.invalid',preferredContact:'email'}} consent={{intakePermission:true,privacyAcknowledged:true,marketingCall:false,marketingText:false,timestamps:{}}} answers={{}} acknowledged={true} submitting={true} error={null} crisis={false} onEditQuestion={noop} onEditLead={noop} onToggleAck={noop} onSubmit={noop} onBack={noop}/></MemoryRouter>);});
 try {
  const edits=view.root.findAllByType('button').filter(button=>['Edit contact details','Answer','Change'].includes(text(button))||/^[A-Z]+-\d+:/.test(text(button)));
  assert.ok(edits.length>2);
  for(const button of edits)assert.equal(button.props.disabled,true,text(button));
 } finally {await act(async()=>view.unmount());}
});
