document.addEventListener("DOMContentLoaded", () => {
  let currentPath = window.location.pathname.split("/").pop();
  if (currentPath === "") {
    currentPath = "index.html";

  }

  fetch("/scripts/data.json")
    .then((response) => response.json())
    .then((responseData) => {


      const isLogin = currentPath === "login.html";
      const isReportTask = currentPath === "report-task.html";
      const data = isLogin ? responseData.login[0] : isReportTask ? responseData.report[0] : responseData.form[0];


      const titleElement = document.getElementById("title");
      if (titleElement) {
        titleElement.textContent = data.title;
      }

      const nameElement = document.getElementById("Firstname");
      if (nameElement) {
        nameElement.textContent = data.name;
      }

      const lastnameElement = document.getElementById("lastnameLabel");
      if (lastnameElement) {
        lastnameElement.textContent = data.lastname;
      }

      const emailElement = document.getElementById("emailLabel");
      if (emailElement) {
        emailElement.textContent = data.email;
      }

      const passwordElement = document.getElementById("passwordLabel");
      if (passwordElement) {
        passwordElement.textContent = data.password;
      }

      const AddressElement = document.getElementById("AddressLabel");
      if (AddressElement) {
          AddressElement.textContent = data.Address;
        }

      const ConfirmMessageElement = document.getElementById("ConfirmMessage");
      if (ConfirmMessageElement) {
        ConfirmMessageElement.textContent = data.ConfirmMessage;
      }

      const myForm = document.getElementById("myForm");
      const Name = document.getElementById("firstname");
      const lastname = document.getElementById("lastname");
      const email = document.getElementById("email");
      const password = document.getElementById("password");
      const Address = document.getElementById("Address");
      const paraConfirmation = document.getElementById("Confirmation");

      if (myForm) {
        myForm.addEventListener("submit", (e) => {
          e.preventDefault();

       if (ConfirmMessageElement) {
         ConfirmMessageElement.textContent = `Hi ${Name.value}, your message has been received, we will contact you at ${email.value}`;
       }

        const formData = {
          name: Name.value,
          lastname: lastname.value,
          email: email.value,
          password: password.value,
          Address: Address.value,
        };

        fetch("/form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
          .then((res) => res.json())
          .then((responsedata) => {
            console.log(responsedata);
            paraConfirmation.textContent = `Hi ${responsedata.name}, your message has been received, we will contact you at ${responsedata.email}`;
          })
          .catch((err) => {
            console.error(err);
          });
      });
    }});
});
