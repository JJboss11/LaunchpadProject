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

      // Set labels from JSON
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

      const successMessage = data.ConfirmMessage;
      const errorMessage = data.ErrorMessage;

      const myForm = document.getElementById("myForm");
      const Name = document.getElementById("firstname");
      const lastname = document.getElementById("lastname");
      const email = document.getElementById("email");
      const password = document.getElementById("password");
      const Address = document.getElementById("Address");

      if (myForm) {
        myForm.addEventListener("submit", (e) => {
          e.preventDefault();

          const formData = {
            name: Name ? Name.value : "",
            lastname: lastname ? lastname.value : "",
            email: email ? email.value : "",
            password: password ? password.value : "",
            Address: Address ? Address.value : "",
        };

          fetch("/form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
            .then((res) => res.json())
            .then((responsedata) => {
              console.log(responsedata);
              showToast(successMessage);
            })
            .catch((err) => {
              console.error(err);
              showToast(errorMessage, "error");
            });
        });
      }
    });
});