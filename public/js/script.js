// ========================================================
// BOOKMYSHOW MAIN CLIENT SCRIPT
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Auto-dismiss Flash Alerts
  setTimeout(() => {
    const alerts = document.querySelectorAll(".alert");
    alerts.forEach((alert) => {
      alert.style.transition = "opacity 0.4s ease";
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 400);
    });
  }, 4000);

  // 2. Watchlist Toggle Buttons
  const watchlistButtons = document.querySelectorAll(".movie-watchlist-btn");
  watchlistButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const movieId = btn.dataset.movieId;
      if (!movieId) return;

      try {
        const response = await fetch(`/watchlist/toggle/${movieId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        const data = await response.json();
        if (data.status === "added") {
          btn.classList.add("active");
          btn.innerHTML = '<i class="fa-solid fa-heart" style="color: #F84464;"></i>';
        } else {
          btn.classList.remove("active");
          btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
      } catch (err) {
        console.error("Watchlist error:", err);
      }
    });
  });

  // 3. Search Autocomplete
  const searchInput = document.getElementById("bmsSearchInput");
  const suggestionDropdown = document.getElementById("bmsSuggestionDropdown");

  if (searchInput && suggestionDropdown) {
    let debounceTimer;

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();

      if (query.length < 2) {
        suggestionDropdown.style.display = "none";
        suggestionDropdown.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/movies/suggest?q=${encodeURIComponent(query)}`);
          const suggestions = await res.json();

          if (!suggestions || suggestions.length === 0) {
            suggestionDropdown.style.display = "none";
            return;
          }

          suggestionDropdown.innerHTML = suggestions
            .map(
              (m) => `
              <div class="bms-suggestion-item" onclick="window.location.href='/movies/${m.id}'">
                <img src="${m.poster}" class="bms-suggestion-poster" alt="${m.title}">
                <div class="d-flex flex-column flex-grow-1">
                  <span class="fw-bold text-white text-truncate" style="max-width: 320px;">${m.title}</span>
                  <small class="text-muted" style="font-size: 0.8rem;">${m.languages} • ⭐ ${m.rating}/10</small>
                </div>
                <span class="badge bg-danger rounded-pill" style="font-size: 0.75rem;">Book</span>
              </div>
            `
            )
            .join("");

          suggestionDropdown.style.display = "block";
        } catch (err) {
          console.error("Search suggestion error:", err);
        }
      }, 250);
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !suggestionDropdown.contains(e.target)) {
        suggestionDropdown.style.display = "none";
      }
    });
  }

  // 4. City Switcher Modal / Selector
  const cityPill = document.getElementById("citySelectorPill");
  const cityModal = document.getElementById("cityModal");
  if (cityPill && cityModal) {
    cityPill.addEventListener("click", () => {
      const bsModal = new bootstrap.Modal(cityModal);
      bsModal.show();
    });
  }

  const cityOptions = document.querySelectorAll(".city-select-card");
  cityOptions.forEach((card) => {
    card.addEventListener("click", async () => {
      const chosenCity = card.dataset.city;
      if (!chosenCity) return;

      try {
        await fetch("/api/set-city", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: chosenCity }),
        });

        // Reload current page or navigate with city param
        const url = new URL(window.location.href);
        url.searchParams.set("city", chosenCity);
        window.location.href = url.toString();
      } catch (err) {
        console.error("City switch error:", err);
      }
    });
  });
});