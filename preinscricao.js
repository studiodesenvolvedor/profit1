import {firebaseConfig,REGISTRATIONS_PATH} from './firebase-config.js';
const plans=['Mensal','Semestral','Anual','Clube Profit','Clube Profit Best Time'];
export async function savePreregistration(input,{fetchImpl=fetch}={}){
 const fullName=String(input.fullName||'').trim().replace(/\s+/g,' ');
 const phone=String(input.phone||'').replace(/\D/g,'');
 const email=String(input.email||'').trim().toLowerCase();
 const plan=input.plan,id=input.requestId;
 if(fullName.length<3||fullName.length>120||fullName.split(' ').length<2||/[\u0000-\u001f]/.test(fullName)||!/^(?:55)?[1-9][0-9]{9,10}$/.test(phone)||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!plans.includes(plan)||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id||''))throw new Error('Confira nome completo, telefone, e-mail e plano.');
 const base=firebaseConfig.databaseURL.replace(/\/$/,'')+'/'+REGISTRATIONS_PATH;
 const probe=await fetchImpl(base+'/probe-'+id+'.json',{method:'GET',signal:AbortSignal.timeout(12000)});
 if(![401,403].includes(probe.status))throw new Error('O recebimento de pré-inscrições está temporariamente indisponível. Fale com a academia.');
 const response=await fetchImpl(base+'/'+encodeURIComponent(id)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName,phone,email,plan,createdAt:{'.sv':'timestamp'}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Não foi possível confirmar o envio. Se já tentou enviar, a academia pode ter recebido sua pré-inscrição.');
 return {ok:true};
}
