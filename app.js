document.addEventListener('DOMContentLoaded', () => {
    const newTaskInput = document.getElementById('new-task');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');

    addTaskButton.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText !== '') {
            const listItem = document.createElement('li');
            listItem.textContent = taskText;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete');
            deleteButton.addEventListener('click', () => {
                taskList.removeChild(listItem);
            });

            listItem.appendChild(deleteButton);
            taskList.appendChild(listItem);

            newTaskInput.value = '';
            newTaskInput.focus();
        }
    }
});
