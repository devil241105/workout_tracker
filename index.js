let exercises = [];
let totalTimer;
let totalTime = 0;
let workoutStarted = false;
let workoutStartTime = 0;
let nextextime = 0;

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

function updateTotalTime() {
    const hours=Math.floor(totalTime/3600);
    const minutes=Math.floor((totalTime%3600)/60);
    const seconds=totalTime%60;
    document.getElementById('totalTime').textContent =`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function addex() {
    const name=document.getElementById('exerciseName').value;
    const reps=document.getElementById('reps').value;
    const hours=parseInt(document.getElementById('hours').value) || 0;
    const minutes=parseInt(document.getElementById('minutes').value) || 0;
    const seconds=parseInt(document.getElementById('seconds').value) || 0;
    const time=hours*3600+minutes*60+seconds;
    if (name && reps && time) {
        exercises.push({name, reps, time, timeLeft: time, completed: false, actualTime: 0, isRunning: false, startTime: 0});
        saveToLocalStorage();
        renderex();
        document.getElementById('exerciseName').value = '';
        document.getElementById('reps').value='';
        document.getElementById('hours').value= '';
        document.getElementById('minutes').value ='';
        document.getElementById('seconds').value ='';
    }
}

function renderex() {
    const list = document.getElementById('exerciseli');
    if (!list) {
        console.error('Exercise list element not found.');
        return;
    }
    list.innerHTML = '';
    exercises.forEach((exercise, index) => {
        if (!exercise) {
            console.error(`Invalid exercise at index ${index}`);
            return;
        }
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${exercise.name}-${exercise.reps}reps-${formatTime(exercise.timeLeft)} left</span>
            <button onclick="toggleex(${index})" ${exercise.completed ? 'disabled' : ''}>${exercise.isRunning ? 'Pause' : 'Start'}</button>
            <button onclick="completeex(${index})" ${exercise.completed ? 'disabled' : ''}>Complete</button>`;
        if (exercise.completed) li.classList.add('completed');
        list.appendChild(li);
    });
}

function toggleex(index) {
    if (index < 0 || index >= exercises.length) {
        console.error(`Invalid exercise index: ${index}`);
        return;
    }
    if (exercises[index].isRunning) {
        stopex(index);
    } else {
        startex(index);
    }
}

function startex(index) {
    if (index < 0 || index >= exercises.length) {
        console.error(`Invalid exercise index: ${index}`);
        return;
    }
    const exercise = exercises[index];
    exercise.isRunning = true;
    const startTime = Date.now() - exercise.actualTime * 1000;
    exercise.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        exercise.actualTime = Math.min(elapsed, exercise.time); 
        exercise.timeLeft = Math.max(0, exercise.time - elapsed);
        if (exercise.timeLeft <= 0 && !exercise.completed) {
            completeex(index);
        }
        renderex();
        saveToLocalStorage();
    }, 1000);
    renderex();
    document.querySelector('.end-workout').style.display = 'block';
}

function stopex(index) {
    if (index < 0 || index >= exercises.length) {
        console.error(`Invalid exercise index: ${index}`);
        return;
    }
    const exercise = exercises[index];
    exercise.isRunning = false;
    clearInterval(exercise.timer);
    exercise.timer = null;
    renderex();
    saveToLocalStorage();
}


function completeex(index) {
    if (index < 0 || index >= exercises.length) {
        console.error(`Invalid exercise index: ${index}`);
        return;
    }
    stopex(index);
    const exercise = exercises[index];
    exercise.completed = true;
    exercise.actualTime = Math.min(exercise.actualTime, exercise.time);
    renderex();
    saveToLocalStorage();
    checkcomplete();
    nextex(index);
}


function nextex(currindex) {
    const nextIndex = currindex + 1;
    if (nextIndex < exercises.length && !exercises[nextIndex].completed) {
        nextextime = Date.now() + 30000;
        saveToLocalStorage();
        setTimeout(() => startex(nextIndex), 30000); 
    }
}


function start_t_time() {
    workoutStarted = true;
    workoutStartTime = Date.now();
    nextextime = workoutStartTime;
    startnextex();
    startTotalTimer();
    saveToLocalStorage();
    document.querySelector('.upstart').style.display = 'none';
}


function startnextex() {
    const now = Date.now();
    if (now >= nextextime) {
        const nextIndex = exercises.findIndex(ex => !ex.completed);
        if (nextIndex !== -1) {
            startex(nextIndex);
            nextextime = now + (parseInt(exercises[nextIndex].time) * 1000) + 30000;
            saveToLocalStorage();
            setTimeout(startnextex, nextextime - now);
        }
    } else {
        setTimeout(startnextex, nextextime - now);
    }
}


function startTotalTimer() {
    if (!totalTimer) {
        totalTimer = setInterval(() => {
            totalTime = Math.floor((Date.now() - workoutStartTime) / 1000);
            updateTotalTime();
            saveToLocalStorage();
        }, 1000);
    }
}

function resume_all() {
    const now = Date.now();
    exercises.forEach((exercise, index) => {
        if (exercise.isRunning && !exercise.completed) {
            exercise.startTime = now - exercise.actualTime * 1000;
            startex(index);
        }
    });
    if (workoutStarted) {
        workoutStartTime = now - totalTime * 1000;
        startTotalTimer();
        startnextex();
    }
}


function checkcomplete() {
    if (exercises.every(exercise => exercise.completed)) {
        workoutStarted = false;
        clearInterval(totalTimer);
        totalTimer = null;
        saveToLocalStorage();
    }
}


function new_workout() {
    exercises = [];
    totalTime = 0;
    workoutStarted = false;
    workoutStartTime = 0;
    nextextime = 0;
    clearInterval(totalTimer);
    totalTimer = null;
    saveToLocalStorage();
    renderex();
    updateTotalTime();
    const summaryTable = document.getElementById('summary');
    summaryTable.innerHTML = '';
    summaryTable.style.display = 'none';
    document.querySelector('.upstart').style.display = 'block';
}


function showsummary() {
    const summaryTable = document.getElementById('summary');
    summaryTable.innerHTML = `
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function saveToLocalStorage() {
    localStorage.setItem('exercises', JSON.stringify(exercises));
    localStorage.setItem('totalTime', totalTime.toString());
    localStorage.setItem('workoutStarted', workoutStarted.toString());
    localStorage.setItem('workoutStartTime', workoutStartTime.toString());
    localStorage.setItem('nextextime', nextextime.toString());
}







window.onload = init;