/* ---------------- STORAGE ---------------- */
const LS_KEY = "habit_app_v1";

function readStore(){ return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
function writeStore(obj){ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }

/* Demo user */
(function initDemo(){
  const s = readStore();
  if(!s.users) s.users = {};
  if(!s.users["demo"]) s.users["demo"] = { password:"demo123", habits:[] };
  writeStore(s);
})();

/* ---------------- AUTH UI ---------------- */
function showSignup(){
  loginForm.style.display="none";
  signupForm.style.display="block";
  forgotForm.style.display="none";
}
function showLogin(){
  loginForm.style.display="block";
  signupForm.style.display="none";
  forgotForm.style.display="none";
}
function showForgot(){
  loginForm.style.display="none";
  signupForm.style.display="none";
  forgotForm.style.display="block";
}

/* ---------------- SIGNUP ---------------- */
function doSignup(){
  const u = signupUser.value.trim();
  const p = signupPass.value;

  if(!u || !p){ alert("Enter details"); return; }

  const s = readStore();
  if(s.users[u]){ alert("Username exists"); return; }

  s.users[u] = { password:p, habits:[] };
  writeStore(s);

  alert("Account created.");
  showLogin();
}

/* ---------------- LOGIN ---------------- */
let currentUser = null;

function doLogin(){
  const u = loginUser.value.trim();
  const p = loginPass.value;

  const s = readStore();
  if(!s.users[u] || s.users[u].password !== p){
    alert("Invalid username or password");
    return;
  }

  startSession(u);
}

/* ---------------- FORGOT PASSWORD ---------------- */
function resetPassword(){
  const u = forgotUser.value.trim();
  const np = forgotPass.value;

  const s = readStore();
  if(!s.users[u]){ alert("User not found"); return; }

  s.users[u].password = np;
  writeStore(s);

  alert("Password updated!");
  showLogin();
}

/* ---------------- SESSION ---------------- */
function startSession(u){
  currentUser = u;
  localStorage.setItem("habit_current", u);

  authView.style.display="none";
  dashboardView.style.display="block";

  currentUser.innerText = u;

  renderHabits();
  renderSummary();
}

function logout(){
  currentUser = null;
  localStorage.removeItem("habit_current");
  authView.style.display="flex";
  dashboardView.style.display="none";
}

/* Auto-login */
(function(){
  const u = localStorage.getItem("habit_current");
  const s = readStore();
  if(u && s.users && s.users[u]) startSession(u);
})();

/* ---------------- HABIT FUNCTIONS ---------------- */
function uid(){ return Date.now() + "_" + Math.random().toString(36).slice(2); }

function getHabits(){
  const s = readStore();
  return s.users[currentUser].habits || [];
}

function saveHabits(list){
  const s = readStore();
  s.users[currentUser].habits = list;
  writeStore(s);
}

function addHabit(){
  const name = newHabit.value.trim();
  if(!name) return;

  const h = getHabits();
  h.unshift({
    id:uid(), name:name, created:Date.now(), records:{}
  });

  saveHabits(h);
  newHabit.value="";
  renderHabits();
  renderSummary();
}

function deleteHabit(id){
  if(!confirm("Delete habit?")) return;
  saveHabits(getHabits().filter(h=>h.id!==id));
  renderHabits(); 
  renderSummary();
}

function toggleRecord(id,date){
  const list = getHabits();
  const h = list.find(x=>x.id===id);
  if(!h.records) h.records={};

  if(h.records[date]) delete h.records[date];
  else h.records[date] = true;

  saveHabits(list);
  renderHabits(); 
  renderSummary();
}

/* ---------------- RENDERING ---------------- */
function dateKey(d){
  return d.toISOString().slice(0,10);
}
function last7days(){
  const arr=[];
  for(let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    arr.push(new Date(d));
  }
  return arr;
}

function renderHabits(){
  habitList.innerHTML="";
  const habits = getHabits();

  if(habits.length===0){
    habitList.innerHTML="<div class='muted'>No habits yet.</div>";
    return;
  }

  const dates = last7days();

  habits.forEach(h=>{
    const li = document.createElement("li");
    li.className="habit-item";

    const info = document.createElement("div");
    info.className="info";
    info.innerHTML = `
      <div class="habit-name">${h.name}</div>
      <div class="small">Added: ${new Date(h.created).toLocaleDateString()}</div>
    `;

    const week = document.createElement("div");
    week.className="week";

    dates.forEach(d=>{
      const key = dateKey(d);
      const box = document.createElement("div");
      box.className="day";
      box.textContent = d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2);

      if(h.records[key]) box.classList.add("checked");
      box.onclick = ()=> toggleRecord(h.id,key);

      week.appendChild(box);
    });

    const controls = document.createElement("div");
    controls.style="display:flex;flex-direction:column;align-items:flex-end;gap:8px";

    const done = dates.filter(d=>h.records[dateKey(d)]).length;
    const pct = Math.round((done/7)*100);

    controls.innerHTML = `
      <div class="small">${done}/7 • ${pct}%</div>
      <button class="btn btn-ghost" style="padding:6px 8px">Delete</button>
    `;
    controls.querySelector("button").onclick = ()=> deleteHabit(h.id);

    li.appendChild(info);
    li.appendChild(week);
    li.appendChild(controls);

    habitList.appendChild(li);
  });
}

function renderSummary(){
  const habits = getHabits();
  const dates = last7days();

  let total = habits.length * 7;
  let completed = 0;

  habits.forEach(h=>{
    dates.forEach(d=>{
      const k = dateKey(d);
      if(h.records[k]) completed++;
    });
  });

  const pct = total===0 ? 0 : Math.round((completed/total)*100);

  overallPct.textContent = pct + "%";
  overallBar.style.width = pct + "%";

  const today = dateKey(new Date());
  todayCount.textContent = habits.filter(h=>h.records[today]).length;
}

/* Refresh every 60 sec */
setInterval(()=>{
  if(currentUser){
    renderHabits();
    renderSummary();
  }
},60000);

