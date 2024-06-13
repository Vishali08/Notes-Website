const addBox = document.querySelector(".add-box"),
popupBox = document.querySelector(".popup-box"),
popupTitle = popupBox.querySelector("header p"),
closeIcon = popupBox.querySelector("header i"),
titleTag = popupBox.querySelector("input"),
descTag = popupBox.querySelector("textarea"),
addBtn = popupBox.querySelector("button"),
toggleDeletedNotesBtn = document.getElementById("toggleDeletedNotes"),
deletedWrapper = document.querySelector(".deleted-wrapper");

const months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
const notes = JSON.parse(localStorage.getItem("notes") || "[]");
const deletedNotes = JSON.parse(localStorage.getItem("deletedNotes") || "[]");
let isUpdate = false, updateId, draggedElement;

addBox.addEventListener("click", () => {
    popupTitle.innerText = "Add a new Note";
    addBtn.innerText = "Add Note";
    popupBox.classList.add("show");
    document.querySelector("body").style.overflow = "hidden";
    if(window.innerWidth > 660) titleTag.focus();
});

closeIcon.addEventListener("click", () => {
    isUpdate = false;
    titleTag.value = descTag.value = "";
    popupBox.classList.remove("show");
    document.querySelector("body").style.overflow = "auto";
});

toggleDeletedNotesBtn.addEventListener("click", () => {
    if (deletedWrapper.style.display === "none" || deletedWrapper.style.display === "") {
        deletedWrapper.style.display = "block";
        toggleDeletedNotesBtn.innerText = "Hide Deleted Notes";
    } else {
        deletedWrapper.style.display = "none";
        toggleDeletedNotesBtn.innerText = "Show Deleted Notes";
    }
});

function showNotes() {
    if(!notes) return;
    document.querySelectorAll(".note").forEach(li => li.remove());
    notes.forEach((note, id) => {
        let filterDesc = note.description.replaceAll("\n", '<br/>');
        let liTag = `<li class="note" draggable="true" data-id="${id}">
                        <div class="details">
                            <p>${note.title}</p>
                            <span>${filterDesc}</span>
                        </div>
                        <div class="bottom-content">
                            <span>${note.date}</span>
                            <div class="settings">
                                <i onclick="showMenu(this)" class="uil uil-ellipsis-h"></i>
                                <ul class="menu">
                                    <li onclick="updateNote(${id}, '${note.title}', '${filterDesc}')"><i class="uil uil-pen"></i>Edit</li>
                                    <li onclick="deleteNote(${id})"><i class="uil uil-trash"></i>Delete</li>
                                </ul>
                            </div>
                        </div>
                    </li>`;
        addBox.insertAdjacentHTML("afterend", liTag);
    });
    enableDragAndDrop();
    showDeletedNotes();
}
showNotes();

function showMenu(elem) {
    elem.parentElement.classList.add("show");
    document.addEventListener("click", e => {
        if(e.target.tagName != "I" || e.target != elem) {
            elem.parentElement.classList.remove("show");
        }
    });
}

function deleteNote(noteId) {
    let confirmDel = confirm("Are you sure you want to delete this note?");
    if(!confirmDel) return;
    let deletedNote = notes.splice(noteId, 1)[0];
    deletedNotes.unshift(deletedNote); // Add deleted note to the beginning of the array
    localStorage.setItem("notes", JSON.stringify(notes));
    localStorage.setItem("deletedNotes", JSON.stringify(deletedNotes));
    showNotes();
}

function updateNote(noteId, title, filterDesc) {
    let description = filterDesc.replaceAll('<br/>', '\r\n');
    updateId = noteId;
    isUpdate = true;
    addBox.click();
    titleTag.value = title;
    descTag.value = description;
    popupTitle.innerText = "Update a Note";
    addBtn.innerText = "Update Note";
}

addBtn.addEventListener("click", e => {
    e.preventDefault();
    let title = titleTag.value.trim(),
    description = descTag.value.trim();

    if(title || description) {
        let currentDate = new Date(),
        month = months[currentDate.getMonth()],
        day = currentDate.getDate(),
        year = currentDate.getFullYear();

        let noteInfo = {title, description, date: `${month} ${day}, ${year}`}
        if(!isUpdate) {
            notes.push(noteInfo);
        } else {
            isUpdate = false;
            notes[updateId] = noteInfo;
        }
        localStorage.setItem("notes", JSON.stringify(notes));
        showNotes();
        closeIcon.click();
    }
});

function enableDragAndDrop() {
    const notesList = document.querySelectorAll(".note");

    notesList.forEach(note => {
        note.addEventListener("dragstart", (e) => {
            draggedElement = note;
            note.classList.add("dragging");
            setTimeout(() => {
                note.style.display = "none";
            }, 0);
        });

        note.addEventListener("dragend", () => {
            note.classList.remove("dragging");
            setTimeout(() => {
                note.style.display = "block";
                draggedElement = null;
            }, 0);
        });
    });

    const wrapper = document.querySelector(".wrapper");
    wrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(wrapper, e.clientY);
        const draggable = document.querySelector(".dragging");
        if (afterElement == null) {
            wrapper.appendChild(draggable);
        } else {
            wrapper.insertBefore(draggable, afterElement);
        }
    });

    wrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(wrapper, e.clientY);
        if (afterElement == null) {
            wrapper.appendChild(draggedElement);
        } else {
            wrapper.insertBefore(draggedElement, afterElement);
        }
        updateNotesOrder();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.note:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateNotesOrder() {
    const notesList = document.querySelectorAll(".note");
    const newOrder = Array.from(notesList).map(note => notes[note.getAttribute('data-id')]);
    notes.length = 0;
    notes.push(...newOrder);
    localStorage.setItem("notes", JSON.stringify(notes));
    showNotes();
}

function showDeletedNotes() {
    const deletedNotesContainer = document.querySelector(".deleted-notes");
    deletedNotesContainer.innerHTML = ""; // Clear existing notes

    deletedNotes.forEach((note, id) => {
        let filterDesc = note.description.replaceAll("\n", '<br/>');
        let liTag = `<li class="note" data-id="${id}">
                        <div class="details">
                            <p>${note.title}</p>
                            <span>${filterDesc}</span>
                        </div>
                        <div class="bottom-content">
                            <span>${note.date}</span>
                        </div>
                    </li>`;
        deletedNotesContainer.insertAdjacentHTML("beforeend", liTag);
    });
}
