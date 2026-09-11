import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://ghploxhswyggivoasxfl.supabase.co',
  'sb_publishable_9gUIApZnAsqiQT3I5IEM3g_dcrh_X1I'
)

let listings = [];
let currentUser = null;
let userFavorites = new Set();

const getTone = (id) => {
  const tones = ['blue','orange','green','purple','cream','red'];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return tones[sum % tones.length];
};
const getIcon = (id) => {
  const icons = ['◒','▤','⊙','◧','▰','♢'];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return icons[(sum + 1) % icons.length];
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fetchListings = async () => {
  const { data, error } = await supabase.from('listings').select('*, profiles(full_name)');
  if (!error && data) {
    listings = data.map(l => ({
      id: l.id,
      title: l.title,
      category: l.category,
      price: l.price,
      seller: (l.profiles && l.profiles.full_name) ? l.profiles.full_name : 'Student',
      time: timeAgo(l.created_at),
      tone: getTone(l.id),
      icon: getIcon(l.id),
      fresh: new Date(l.created_at).getTime()
    }));
    renderListings();
  }
};
const categories=['All','Books','Tech','Home','Bikes','Style'],grid=document.querySelector('#grid'),searchInput=document.querySelector('#search-input'),categorySelect=document.querySelector('#category-select'),sortSelect=document.querySelector('#sort-select'),categoryPills=document.querySelector('#category-pills');let activeCategory='All';

const formatPrice=price=>price===0?'Free':`$${price}`;

const listingImage=l=>`<div class="listing-art art-${l.tone}" aria-hidden="true"><span class="art-spark">✦</span><span class="product-icon">${l.icon}</span><span class="art-shadow"></span></div>`;

const cardTemplate=l=>{
  const isSaved = currentUser && userFavorites.has(l.id);
  return `<article class="listing-card"><div class="image-wrap">${listingImage(l)}<button class="save-button ${isSaved ? 'saved' : ''}" aria-label="Save ${l.title}" data-id="${l.id}">${isSaved ? '♥' : '♡'}</button><button class="report-button" aria-label="Report ${l.title}" data-id="${l.id}">⚑</button></div><div class="listing-info"><div class="listing-topline"><span>${l.category} ${l.seller_verified ? '✓' : ''}</span><span>${l.view_count||0} views · ${l.time}</span></div><h3>${l.title}</h3><div class="listing-bottom"><strong>${formatPrice(l.price)}</strong><span>${l.seller}</span></div></div></article>`;
};

function renderCategories(){categoryPills.innerHTML=categories.map(c=>`<button class="pill ${c===activeCategory?'active':''}" data-category="${c}">${c}</button>`).join('');categoryPills.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.category;categorySelect.value=activeCategory.toLowerCase();renderCategories();renderListings()}))}

function renderListings(){
  const query=searchInput.value.trim().toLowerCase(),selected=categorySelect.value;
  let filtered=listings.filter(l=>((activeCategory==='All'&&selected==='all')||l.category.toLowerCase()===selected||l.category===activeCategory)&&`${l.title} ${l.category} ${l.seller}`.toLowerCase().includes(query));
  if(sortSelect.value==='price-low')filtered.sort((a,b)=>a.price-b.price);
  if(sortSelect.value==='price-high')filtered.sort((a,b)=>b.price-a.price);
  if(sortSelect.value==='newest')filtered.sort((a,b)=>b.fresh-a.fresh);
  grid.innerHTML=filtered.map(cardTemplate).join('');
  document.querySelector('#results-count').textContent=`${filtered.length} ${filtered.length===1?'listing':'listings'} nearby`;
  document.querySelector('#empty').hidden=filtered.length!==0;
  grid.hidden=filtered.length===0;

  grid.querySelectorAll('.save-button').forEach(b=>b.addEventListener('click',async()=>{
    if (!currentUser) return authModal.showModal();
    const listingId = b.dataset.id;
    const isSaved = b.classList.toggle('saved');
    b.textContent = isSaved ? '♥' : '♡';
    if (isSaved) {
      userFavorites.add(listingId);
      await supabase.from('favorites').insert({ user_id: currentUser.id, listing_id: listingId });
    } else {
      userFavorites.delete(listingId);
      await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('listing_id', listingId);
    }
  }));

  grid.querySelectorAll('.report-button').forEach(b=>b.addEventListener('click',async()=>{
    const reason=prompt('Reason for reporting?');
    if(!reason)return;
    const{error}=await supabase.from('reports').insert({listing_id:b.dataset.id,reason});
    if(!error)alert('Report submitted. Thank you!');
    else alert('Error submitting report. Please try again.');
  }));
}

categories.slice(1).forEach(c=>{const o=document.createElement('option');o.value=c.toLowerCase();o.textContent=c;categorySelect.append(o)});
searchInput.addEventListener('input',renderListings);
categorySelect.addEventListener('change',()=>{activeCategory=categorySelect.value==='all'?'All':categorySelect.options[categorySelect.selectedIndex].text;renderCategories();renderListings()});
sortSelect.addEventListener('change',renderListings);
document.querySelector('#reset-filters').addEventListener('click',()=>{searchInput.value='';categorySelect.value='all';activeCategory='All';renderCategories();renderListings()});
renderCategories();
fetchListings();

const authModal = document.querySelector('#auth-modal');
const authSection = document.querySelector('#auth-section');
const authForm = document.querySelector('#auth-form');
const authEmail = document.querySelector('#auth-email');
const authPassword = document.querySelector('#auth-password');
const authError = document.querySelector('#auth-error');
const authLoginSubmit = document.querySelector('#auth-login-submit');
const authSignupSubmit = document.querySelector('#auth-signup-submit');
const postModal = document.querySelector('#post-modal');
const postItemBtn = document.querySelector('#post-item-btn');
const postForm = document.querySelector('#post-form');
const postError = document.querySelector('#post-error');

document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', (e) => e.target.closest('dialog').close()));

authLoginSubmit.addEventListener('click', async (e) => {
  e.preventDefault();
  if(!authForm.reportValidity()) return;
  authError.hidden = true;
  const { error } = await supabase.auth.signInWithPassword({ email: authEmail.value, password: authPassword.value });
  if (error) { authError.textContent = error.message; authError.hidden = false; }
  else authModal.close();
});

authSignupSubmit.addEventListener('click', async (e) => {
  e.preventDefault();
  if(!authForm.reportValidity()) return;
  authError.hidden = true;
  const { error } = await supabase.auth.signUp({ email: authEmail.value, password: authPassword.value });
  if (error) { authError.textContent = error.message; authError.hidden = false; }
  else { alert('Sign up successful! Please log in.'); authModal.close(); }
});

supabase.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    authSection.innerHTML = `<span class="text-link" style="font-size:0.8rem;opacity:0.8;margin-right:10px">${currentUser.email}</span> <button id="logout-btn" class="text-link">Log out</button>`;
    document.querySelector('#logout-btn').addEventListener('click', () => supabase.auth.signOut());
    
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', currentUser.id);
    userFavorites = new Set((data || []).map(f => f.listing_id));
    renderListings();
  } else {
    authSection.innerHTML = `<button id="login-btn" class="text-link">Log in</button>`;
    document.querySelector('#login-btn').addEventListener('click', () => authModal.showModal());
    userFavorites.clear();
    renderListings();
  }
});

postItemBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!currentUser) return authModal.showModal();
  postModal.showModal();
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  postError.hidden = true;
  const title = document.querySelector('#post-title').value;
  const category = document.querySelector('#post-category').value;
  const price = document.querySelector('#post-price').value;
  const description = document.querySelector('#post-desc').value;

  const { error } = await supabase.from('listings').insert({
    title, category, price: parseFloat(price), description, seller_id: currentUser.id
  });

  if (error) { postError.textContent = error.message; postError.hidden = false; }
  else { 
    postForm.reset(); 
    postModal.close(); 
    fetchListings(); 
  }
});