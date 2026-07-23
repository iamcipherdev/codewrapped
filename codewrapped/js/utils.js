export const compact=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1});
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const formatDate=value=>new Intl.DateTimeFormat('en',{month:'short',year:'numeric'}).format(new Date(value));
export function escapeText(value=''){return String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}
export function showToast(message){const toast=document.querySelector('#toast');toast.textContent=`✓ ${message}`;toast.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{toast.hidden=true},2200);}
export function observeReveals(root=document){const items=root.querySelectorAll('.reveal');if(matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(item=>item.classList.add('visible'));return;}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});items.forEach(item=>observer.observe(item));}
