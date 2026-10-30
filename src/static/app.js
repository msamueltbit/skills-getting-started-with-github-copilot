document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, `${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "activity-participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (details.participants.length > 0) {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "participant-delete-button";
            deleteButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            deleteButton.title = `Unregister ${email}`;

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("aria-hidden", "true");
            deleteIcon.setAttribute("focusable", "false");

            const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            deletePath.setAttribute(
              "d",
              "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
            );
            deleteIcon.appendChild(deletePath);
            deleteButton.appendChild(deleteIcon);
            deleteButton.addEventListener("click", () => {
              unregisterParticipant(name, email, deleteButton);
            });

            participant.appendChild(deleteButton);
            participantsList.appendChild(participant);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participant-list";
          emptyMessage.textContent = "No students registered yet";
          participantsList.appendChild(emptyMessage);
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      return true;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
      return false;
    }
  }

  async function unregisterParticipant(activity, email, deleteButton) {
    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister student");
      }

      if (await fetchActivities()) {
        showMessage(result.message, "success");
      } else {
        showMessage(`${result.message}, but the activity list could not be refreshed.`, "error");
      }
    } catch (error) {
      showMessage(error.message || "Failed to unregister student. Please try again.", "error");
      console.error("Error unregistering student:", error);
      deleteButton.disabled = false;
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        if (await fetchActivities()) {
          showMessage(result.message, "success");
        } else {
          showMessage(`${result.message}, but the activity list could not be refreshed.`, "error");
        }
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }

    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
