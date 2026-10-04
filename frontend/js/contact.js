const contactForm = document.getElementById("contactForm");
const nextBtn = document.getElementById("nextBtn");


// =========================
// Load Existing Contact Data
// =========================

async function loadContactData() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        if (!data.resume || !data.resume.contact) {
            return;
        }

        const contact = data.resume.contact;

        document.getElementById("firstname").value =
            contact.firstname || "";

        document.getElementById("lastname").value =
            contact.lastname || "";

        document.getElementById("phone").value =
            contact.phone || "";

        document.getElementById("email").value =
            contact.email || "";

        document.getElementById("address").value =
            contact.address || "";

        document.getElementById("city").value =
            contact.city || "";

        document.getElementById("state").value =
            contact.state || "";

        document.getElementById("country").value =
            contact.country || "";

        document.getElementById("postalcode").value =
            contact.postalcode || "";

    } catch (error) {

        console.error("Error loading contact data:", error);

    }

}


// =========================
// Save / Update Contact
// =========================

nextBtn.addEventListener("click", async () => {
    console.log("NEXT BUTTON CLICKED");
    alert("Next button clicked");


    const contactData = {

        firstname:
            document.getElementById("firstname").value.trim(),

        lastname:
            document.getElementById("lastname").value.trim(),

        phone:
            document.getElementById("phone").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        address:
            document.getElementById("address").value.trim(),

        city:
            document.getElementById("city").value.trim(),

        state:
            document.getElementById("state").value.trim(),

        country:
            document.getElementById("country").value.trim(),

        postalcode:
            document.getElementById("postalcode").value.trim()

    };


    // Check fields

    for (const value of Object.values(contactData)) {

        if (!value) {

            alert("Please fill all the fields.");

            return;

        }

    }


    // Get token

    const token = localStorage.getItem("token");

    if (!token) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;

    }


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume/contact",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body: JSON.stringify(contactData)

            }
        );


        const data = await response.json();


        if (response.ok) {

            alert("Contact information saved successfully!");

            window.location.href = "education.html";

        } else {

            alert(
                data.message ||
                "Failed to save contact information."
            );

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

});


// Load saved data when page opens

loadContactData();