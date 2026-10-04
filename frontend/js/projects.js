const projectsContainer = document.getElementById("projectsContainer");
const addProjectBtn = document.getElementById("addProjectBtn");
const nextBtn = document.getElementById("nextBtn");

let projectCount = 0;


// =========================
// Create Project Card
// =========================

function createProjectCard(project = {}) {

    projectCount++;

    const projectCard = document.createElement("div");

    projectCard.classList.add("project-card");

    projectCard.innerHTML = `
        <h3>Project ${projectCount}</h3>

        <label for="title-${projectCount}">
            Project Title
        </label>
        <br>

        <input
            type="text"
            id="title-${projectCount}"
            class="project-title"
            placeholder="Name of the project"
            value="${project.title || ""}"
            required
        >

        <br><br>

        <label for="description-${projectCount}">
            Project Description
        </label>
        <br>

        <textarea
            id="description-${projectCount}"
            class="project-description"
            rows="5"
            cols="30"
            placeholder="Tell about the project"
            required
        >${project.description || ""}</textarea>

        <br><br>

        <label for="stack-${projectCount}">
            Technologies Used
        </label>
        <br>

        <input
            type="text"
            id="stack-${projectCount}"
            class="project-stack"
            placeholder="Example: HTML, CSS, JavaScript"
            value="${project.stack || ""}"
            required
        >

        <br><br>

        <label for="github-${projectCount}">
            GitHub URL
        </label>
        <br>

        <input
            type="url"
            id="github-${projectCount}"
            class="project-github"
            placeholder="https://github.com/username/project"
            value="${project.github || ""}"
        >

        <br><br>

        <button
            type="button"
            class="removeProjectBtn"
        >
            Remove Project
        </button>

        <br><br>
    `;

    projectsContainer.appendChild(projectCard);


    // Remove project

    const removeBtn =
        projectCard.querySelector(".removeProjectBtn");

    removeBtn.addEventListener("click", () => {

        projectCard.remove();

    });

}


// =========================
// Load Existing Projects
// =========================

async function loadProjects() {

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
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            return;

        }


        const savedProjects =
            data.resume?.projects || [];


        if (savedProjects.length > 0) {

            // Load existing projects

            savedProjects.forEach((project) => {

                createProjectCard(project);

            });

        } else {

            // No projects yet

            createProjectCard();

        }


    } catch (error) {

        console.error(
            "Error loading projects:",
            error
        );

        // Create an empty project if loading fails

        if (
            projectsContainer.children.length === 0
        ) {

            createProjectCard();

        }

    }

}


// =========================
// Add New Project
// =========================

addProjectBtn.addEventListener("click", () => {

    createProjectCard();

});


// =========================
// Save / Update Projects
// =========================

nextBtn.addEventListener("click", async () => {

    const projectCards =
        projectsContainer.querySelectorAll(
            ".project-card"
        );


    const projects = [];


    projectCards.forEach((card) => {

        const title =
            card.querySelector(
                ".project-title"
            ).value.trim();


        const description =
            card.querySelector(
                ".project-description"
            ).value.trim();


        const stack =
            card.querySelector(
                ".project-stack"
            ).value.trim();


        const github =
            card.querySelector(
                ".project-github"
            ).value.trim();


        if (
            title &&
            description &&
            stack
        ) {

            projects.push({

                title,
                description,
                stack,
                github

            });

        }

    });


    // Check projects

    if (projects.length === 0) {

        alert(
            "Please enter at least one project."
        );

        return;

    }


    // Get login token

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;

    }


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume/projects",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body: JSON.stringify({
                    projects
                })

            }
        );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Projects saved successfully!"
            );

            window.location.href =
                "summary.html";

        } else {

            alert(
                data.message ||
                "Failed to save projects."
            );

        }


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );

    }

});


// =========================
// Load projects when page opens
// =========================

loadProjects();