emailjs.init("9wEs9Usm90OoP69X7");

const popup = document.getElementById("inquiryPopup");

document.querySelector(".form-cta").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("formContainer").style.display = "block"; //show form if prevoius hide exist    
    popup.classList.add("show");
});

function closePopup() {
    popup.classList.remove("show"); //remove popup
    document.getElementById("successContainer").style.display = "none"; //'reset success container to normal state'
    document.getElementById("inquiryForm").reset();    
}

const submitBtn = document.getElementById("submit-btn");

document.getElementById("inquiryForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const message = document.getElementById("message").value;

    if (!name || !email || !phone || !message) {
        alert("Please fill in all fields.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const phonePattern = /^[+]?[\d\s\-()]{6,20}$/;
    if (!phonePattern.test(phone)) {
        alert("Please enter a valid phone number.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    emailjs.send("service_6numhci", "template_tx4jkub", {
        user_name: name,
        user_email: email,
        user_phone: phone,
        user_message: message
    })
        .then(() => {
            document.getElementById("formContainer").style.display = "none";
            document.getElementById("successContainer").style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
        })
        .catch(() => {
            alert("Error sending message. Try again.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
        });
});