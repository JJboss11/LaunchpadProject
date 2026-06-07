//redirect to login if no token
if (!localStorage.getItem('token') && 
    !['login.html', 'signup.html', "profile.html"].includes(window.location.pathname.split('/').pop())) {
    window.location.href = 'login.html';
}

document.addEventListener("DOMContentLoaded", () => {
  let currentPath = window.location.pathname.split("/").pop();
  if (currentPath === "") {
    currentPath = "login.html";
  }
    const isLogin = currentPath === "login.html";
    const isReportTask = currentPath === "report-task.html";
    const isProfile = currentPath === "profile.html";
    const endpoint = isLogin ? "/login" : isProfile ? "/profile" : "/signup"; // 👈 correct endpoint

  fetch("/scripts/data.json")
    .then((response) => response.json())
    .then((responseData) => {
      const data = isLogin ? responseData.login[0] : isReportTask ? responseData.report[0] : isProfile ? responseData.profile[0] : responseData.form[0];
  
      // Set labels from JSON
      const titleElement = document.getElementById("title");
      if (titleElement) {
        titleElement.textContent = data.title;
      }

      const nameElement = document.getElementById("firstnameLabel");
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

      if (myForm && !isProfile) {
        myForm.addEventListener("submit", (e) => {
          e.preventDefault();

          const formData = {
            firstname: Name ? Name.value : "",
            lastname: lastname ? lastname.value : "",
            email: email ? email.value : "",
            password: password ? password.value : "",
            Address: Address ? Address.value : "",
        };

          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
          .then((res) => res.json())
          .then((responsedata) => {
            if (responsedata.success) {
              if (isLogin) {
                  localStorage.setItem('token', responsedata.token);
                  window.location.href = 'index.html'; 
              } 
              else {
                  localStorage.setItem('token', responsedata.token); 
                  showToast(successMessage);
                  setTimeout(() => {window.location.href = 'index.html';}, 1500);
                }
          } else {
              showToast(responsedata.message, "error");
              if (isLogin) {
                if (email) {
                  email.classList.add('input-error');
                }

                if (password) {
                  password.classList.add('input-error');
                }
              }
            }
          })
          .catch((err) => {
            console.error(err);
            showToast(errorMessage, "error");
          });
        });
      }
    });
});