let exercises =[];
let totalTimer;
let totalTime=0;
let workoutStarted=false;
let workoutStartTime=0;
let nextextime=0;

// ye funtion windows ke load hone ke baad chalega 
// jitne bhi variables hai unka data local storage se fetch karke set kar dega
function init() {
    exercises = JSON.parse(localStorage.getItem('exercises')) || [];
    totalTime = parseInt(localStorage.getItem('totalTime')) || 0;
    workoutStarted = localStorage.getItem('workoutStarted') === 'true';
    workoutStartTime = parseInt(localStorage.getItem('workoutStartTime')) || 0;
    nextextime = parseInt(localStorage.getItem('nextextime')) || 0;
    renderex();
    updateTotalTime();
    
    if (workoutStarted) {
        resume_all();
    }
}

// ye funtion time ko format karne ke leye use hota,basically human readable format me time ko convert karta hai
function updateTotalTime() {
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;
    document.getElementById('totalTime').textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ye function list ke data ko exercises array me index wise store karta hai
// store tabhi karega jab exercise name,reps aur time mention hoga
function addex() {
    const name=document.getElementById('exerciseName').value;
    const reps=document.getElementById('reps').value;
    const hours=parseInt(document.getElementById('hours').value) || 0;
    const minutes=parseInt(document.getElementById('minutes').value) || 0;
    const seconds=parseInt(document.getElementById('seconds').value) || 0;
    const time= hours*3600+minutes*60+seconds;
    if (name && reps && time) {
        exercises.push({name,reps,time,timeLeft:time,completed:false,actualTime:0,isRunning:false,startTime:0});
        saveToLocalStorage();
        renderex();
        document.getElementById('exerciseName').value ='';
        document.getElementById('reps').value='';
        document.getElementById('hours').value='';
        document.getElementById('minutes').value='';
        document.getElementById('seconds').value='';
    }
}

// ye funtion details ko ui pe dikhata hai
function renderex() {
    const list=document.getElementById('exerciseli');
    if(!list) {
        console.error('Element not found.');
        return;
    }
    list.innerHTML='';
    exercises.forEach((exercise, index) => {
        const li=document.createElement('li');
        li.innerHTML =`
            <span>${exercise.name}-${exercise.reps}reps-${formatTime(exercise.timeLeft)}</span>
            <button onclick="toggleex(${index})" ${exercise.completed ? 'disabled':''}>${exercise.isRunning ? 'Pause':'Start'}</button>
            <button onclick="completeex(${index})" ${exercise.completed ? 'disabled':''}>Complete</button>`;
        if(exercise.completed) li.classList.add('completed');
        list.appendChild(li);
    });
}

// ye exercise ko toggle karne ke leye hai,basically on and off
function toggleex(index) {
    if (exercises[index].isRunning) {
        stopex(index);
    } else {
        startex(index);
    }
}

// ye function timer start karta hai kist ke leye
function startex(index) {
    exercises[index].isRunning = true;
    if (!exercises[index].startTime) {
        exercises[index].startTime=Date.now();
    }
    exercises[index].timer=setInterval(() => {
        const elapsed = Math.floor((Date.now()-exercises[index].startTime)/1000);
        exercises[index].timeLeft=Math.max(0, exercises[index].time - elapsed);
        exercises[index].actualTime=elapsed;
        if (exercises[index].timeLeft<=0) {
            completeex(index);
        }
        renderex();
        saveToLocalStorage();
    }, 1000);
    renderex();
}

// ye function timer stop karne ke leye hai
function stopex(index) {
    exercises[index].isRunning=false;
    clearInterval(exercises[index].timer);
    exercises[index].timer=null;
    renderex();
    saveToLocalStorage();
}

// ye function exercise ko complete karta hai 
function completeex(index) {
    stopex(index);
    exercises[index].completed = true;
    exercises[index].timeLeft = 0;
    renderex();
    saveToLocalStorage();
    checkcomplete();
    nextex(index);
}

//ye function next exercise ke time ko set karta 
function nextex(currindex) {
    const nextIndex=currindex+1;
    if (nextIndex<exercises.length && !exercises[nextIndex].completed) {
        nextextime=Date.now()+30000;
        saveToLocalStorage();
        setTimeout(() => startex(nextIndex), 30000); // 30 sec
    }
}

//start the overall workout session
function start_t_time() {
    workoutStarted=true;
    workoutStartTime=Date.now();
    nextextime=workoutStartTime;
    startnextex();
    startTotalTimer();
    saveToLocalStorage();
}

// ye function next exercise ko start karta hai
function startnextex() {
    const now=Date.now();
    if (now>=nextextime) {
        const nextIndex=exercises.findIndex(ex => !ex.completed);
        if (nextIndex !==-1) {
            startex(nextIndex);
            nextextime=now+(parseInt(exercises[nextIndex].time)*1000)+30000;
            saveToLocalStorage();
            setTimeout(startnextex, nextextime-now);
        }
    } else {
        setTimeout(startnextex, nextextime-now);
    }
}

// ye function overall workout time ko start karta hai
function startTotalTimer() {
    if(!totalTimer) {
        totalTimer=setInterval(() => {
            totalTime=Math.floor((Date.now()-workoutStartTime)/1000);
            updateTotalTime();
            saveToLocalStorage();
        },1000);
    }
}

// ye function sabhi unfinished exercises ko resume karta hai local storage se data le ke
function resume_all() {
    const now=Date.now();
    exercises.forEach((exercise,index) => {
        if (exercise.isRunning && !exercise.completed) {
            exercise.startTime=now-exercise.actualTime*1000;
            startex(index);
        }
    });
    if(workoutStarted) {
        workoutStartTime=now-totalTime*1000;
        startTotalTimer();
        startnextex();
    }
}

//chech karne ke leye ki exercise complete hua hai ya nahi
function checkcomplete() {
    if(exercises.every(exercise => exercise.completed)) {
        workoutStarted=false;
        clearInterval(totalTimer);
        totalTimer=null;
        saveToLocalStorage();
    }
}

// new workout add karne ke leye jisme ham sabhi varaibles ko reset kar denge 
function new_workout() {
    exercises=[];
    totalTime=0;
    workoutStarted=false;
    workoutStartTime=0;
    nextextime=0;
    clearInterval(totalTimer);
    totalTimer=null;
    saveToLocalStorage();
    renderex();
    updateTotalTime();
    const summaryTable=document.getElementById('summary');
    summaryTable.innerHTML='';
    summaryTable.style.display='none';
}

//sumaary show karne ke leye
function showsummary() {
    const summaryTable=document.getElementById('summary');
    summaryTable.innerHTML= `
        <table>
            <tr>
                <th>Exercise Name</th>
                <th>Allotted Time</th>
                <th>Actual Time Taken</th>
            </tr>
            ${exercises.map(exercise => `
                <tr>
                    <td>${exercise.name}</td>
                    <td>${formatTime(exercise.time)}</td>
                    <td>${formatTime(exercise.actualTime)}</td>
                </tr>
            `).join('')}
        </table>
    `;
    summaryTable.style.display = 'block';
}

function formatTime(seconds) {
    const hours=Math.floor(seconds/3600);
    const mins=Math.floor((seconds%3600)/60);
    const secs=seconds%60;
    return `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
function saveToLocalStorage() {
    localStorage.setItem('exercises',JSON.stringify(exercises));
    localStorage.setItem('totalTime',totalTime.toString());
    localStorage.setItem('workoutStarted',workoutStarted.toString());
    localStorage.setItem('workoutStartTime',workoutStartTime.toString());
    localStorage.setItem('nextextime',nextextime.toString());
}
window.onload = init; //browser ke load hone ke baad ye funtion chalega