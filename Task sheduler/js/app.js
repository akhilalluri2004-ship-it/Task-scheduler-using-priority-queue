// Initialize Heap and Tasks
let taskHeap = new MinHeap();
const STORAGE_KEY = 'smart_task_scheduler_tasks';

// DOM Elements
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-links a');

// Forms and Inputs
const addTaskForm = document.getElementById('add-task-form');
const taskNameInput = document.getElementById('task-name');
const taskDeadlineInput = document.getElementById('task-deadline');

// Scheduler View Elements
const nextTaskContainer = document.getElementById('next-task-container');
const nextTaskContent = document.getElementById('next-task-content');
const completeNextBtn = document.getElementById('complete-next-btn');
const tasksTbody = document.getElementById('tasks-tbody');
const emptyState = document.getElementById('empty-state');
const tasksTable = document.getElementById('tasks-table');

// Heap Visualization Elements
const heapArrayContainer = document.getElementById('heap-array-container');
const heapExplanation = document.getElementById('heap-explanation');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupNavigation();
    setupForms();
});

// --- Data Management ---
function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const tasks = JSON.parse(saved);
            // Rebuild heap property
            taskHeap.buildHeap(tasks);
        } catch (e) {
            console.error('Failed to parse tasks from localStorage');
            taskHeap = new MinHeap();
        }
    }
    updateUI();
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskHeap.getArray()));
    updateUI();
}

// --- Navigation ---
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            navigateTo(targetId);
        });
    });
}

// Make globally available for inline onclick attributes
window.navigateTo = function(targetId) {
    // Hide all views
    views.forEach(view => view.classList.remove('active-view'));
    
    // Remove active class from nav links
    navLinks.forEach(link => link.classList.remove('active'));

    // Show target view
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active-view');

    // Set active link
    const activeLink = document.querySelector(`.nav-links a[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Refresh UI specifically for visualization when switching to it
    if (targetId === 'heap-view') {
        renderHeapVisualization();
    }
}

// --- Forms ---
function setupForms() {
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = taskNameInput.value.trim();
            const deadline = taskDeadlineInput.value;

            if (!name || !deadline) {
                alert("Please fill all fields correctly.");
                return;
            }

            let priority = 50; // Default priority if no tie

            // Check for existing tasks with the exact same deadline
            const currentTasks = taskHeap.getArray();
            const hasSameDeadline = currentTasks.some(t => {
                return new Date(t.deadline).getTime() === new Date(deadline).getTime();
            });

            if (hasSameDeadline) {
                const priorityStr = prompt(`Another task exists with the same deadline! Please enter a priority level (1-100) to break the tie (Lower = More Important):`, "50");
                if (priorityStr === null) return; // User cancelled
                priority = parseInt(priorityStr);
                if (isNaN(priority)) priority = 50;
            }

            const newTask = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name,
                deadline,
                priority,
                createdAt: Date.now()
            };

            taskHeap.insert(newTask);
            saveTasks();
            
            // Reset form and navigate to scheduler
            addTaskForm.reset();
            navigateTo('scheduler-view');
        });
    }

    if (completeNextBtn) {
        completeNextBtn.addEventListener('click', () => {
            const completed = taskHeap.extractMin();
            if (completed) {
                saveTasks();
                // Optional: Show toast or animation
            }
        });
    }
}

// Make global for inline handlers
window.deleteTask = function(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        const success = taskHeap.removeById(id);
        if (success) saveTasks();
    }
}

// Removed updatePriority as priority is now dynamically based on deadline rank

// --- UI Updates ---
function updateUI() {
    renderScheduler();
    renderNextTask();
    renderHeapVisualization();
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString([], { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit'
    });
}

function renderNextTask() {
    const nextTask = taskHeap.peek();
    if (!nextTask) {
        nextTaskContainer.classList.add('hidden');
        return;
    }

    nextTaskContainer.classList.remove('hidden');
    nextTaskContent.innerHTML = `
        <h4>${nextTask.name}</h4>
        <p><i class="fa-regular fa-clock"></i> Deadline: ${formatDate(nextTask.deadline)} &nbsp; | &nbsp; <span class="priority-badge">Priority: 1</span></p>
    `;
}

function renderScheduler() {
    tasksTbody.innerHTML = '';
    
    // To display tasks in sorted order without destroying our main heap, 
    // we create a temporary heap and extract all
    const tempHeap = new MinHeap();
    tempHeap.buildHeap(JSON.parse(JSON.stringify(taskHeap.getArray()))); // Deep copy

    const sortedTasks = [];
    while (tempHeap.peek() !== null) {
        sortedTasks.push(tempHeap.extractMin());
    }

    if (sortedTasks.length === 0) {
        tasksTable.style.display = 'none';
        emptyState.classList.remove('hidden');
    } else {
        tasksTable.style.display = 'table';
        emptyState.classList.add('hidden');

        sortedTasks.forEach((task, index) => {
            const displayPriority = index + 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="priority-badge">${displayPriority}</span></td>
                <td><strong>${task.name}</strong></td>
                <td>${formatDate(task.deadline)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')" title="Delete Task"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tasksTbody.appendChild(tr);
        });
    }
}

function renderHeapVisualization() {
    if (!heapArrayContainer) return;
    
    const array = taskHeap.getArray();
    heapArrayContainer.innerHTML = '';

    if (array.length === 0) {
        heapExplanation.innerHTML = "The heap is currently empty. Add tasks to visualize.";
        return;
    }

    let html = '';
    array.forEach((task, index) => {
        html += `
            <div class="heap-box">
                <span class="index">[${index}]</span>
                <span style="font-size: 0.8rem; opacity: 0.9;" title="${task.name}">${task.name.substring(0, 10)}${task.name.length > 10 ? '...' : ''}</span>
            </div>
        `;
    });

    heapArrayContainer.innerHTML = html;
    
    const root = array[0];
    heapExplanation.innerHTML = `
        <strong>Current State:</strong> Array has ${array.length} elements. 
        <br>Root element at index 0 is <strong>${root.name}</strong>, which is the next task to be executed based on the earliest deadline.
        <br>For any node at index <code>i</code>, left child is at <code>2i+1</code> and right child is at <code>2i+2</code>.
    `;
}
