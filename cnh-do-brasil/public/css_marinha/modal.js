"use strict"

function showModal(className) {
    var modal = document.querySelector("."+className);

    modal.classList.add("show-modal");

    function windowOnClick(event) {
        if (event.target === modal) {
            modal.classList.toggle("show-modal");
        }
    }
    window.addEventListener("click", windowOnClick);
}

function closeModal(className) {
    var modal = document.querySelector("."+className);
    modal.classList.remove("show-modal");
}
