// ========================================================
// BOOKMYSHOW SEAT SELECTION & LIVE PRICING ENGINE
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  const seatCells = document.querySelectorAll(".seat-cell:not(.booked)");
  const selectedSeatsInput = document.getElementById("selectedSeatsInput");
  const seatCategoryInput = document.getElementById("seatCategoryInput");
  const selectedSnacksInput = document.getElementById("selectedSnacksInput");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const summarySeatsList = document.getElementById("summarySeatsList");
  const summaryTicketPrice = document.getElementById("summaryTicketPrice");
  const summarySnacksPrice = document.getElementById("summarySnacksPrice");
  const summaryConvenienceFee = document.getElementById("summaryConvenienceFee");
  const summaryGrandTotal = document.getElementById("summaryGrandTotal");

  let selectedSeats = [];
  let currentCategory = "Prime";
  let seatRate = 350;

  // Selected snacks dictionary: { [snackId]: { name, price, quantity } }
  const selectedSnacks = {};

  // Handle Seat Click
  seatCells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const seatId = cell.dataset.seatId;
      const category = cell.dataset.category;
      const price = parseFloat(cell.dataset.price);

      const index = selectedSeats.indexOf(seatId);

      if (index > -1) {
        // Deselect seat
        selectedSeats.splice(index, 1);
        cell.classList.remove("selected");
      } else {
        // Max 8 seats limit per booking
        if (selectedSeats.length >= 8) {
          alert("You can book a maximum of 8 seats per transaction.");
          return;
        }

        // Set dominant category & rate based on last chosen seat
        currentCategory = category;
        seatRate = price;

        selectedSeats.push(seatId);
        cell.classList.add("selected");
      }

      updatePricingSummary();
    });
  });

  // Handle Snack Quantity Changes
  const snackRows = document.querySelectorAll(".snack-item-card");
  snackRows.forEach((card) => {
    const snackId = card.dataset.snackId;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const qtySpan = card.querySelector(".snack-qty");
    const plusBtn = card.querySelector(".snack-plus");
    const minusBtn = card.querySelector(".snack-minus");

    if (plusBtn && minusBtn && qtySpan) {
      plusBtn.addEventListener("click", () => {
        let currentQty = parseInt(qtySpan.textContent) || 0;
        if (currentQty < 10) {
          currentQty++;
          qtySpan.textContent = currentQty;
          selectedSnacks[snackId] = { name, price, quantity: currentQty };
          updatePricingSummary();
        }
      });

      minusBtn.addEventListener("click", () => {
        let currentQty = parseInt(qtySpan.textContent) || 0;
        if (currentQty > 0) {
          currentQty--;
          qtySpan.textContent = currentQty;
          if (currentQty === 0) {
            delete selectedSnacks[snackId];
          } else {
            selectedSnacks[snackId] = { name, price, quantity: currentQty };
          }
          updatePricingSummary();
        }
      });
    }
  });

  // Update Pricing Summary & Inputs
  function updatePricingSummary() {
    const seatCount = selectedSeats.length;

    if (seatCount === 0) {
      if (summarySeatsList) summarySeatsList.textContent = "None selected";
      if (summaryTicketPrice) summaryTicketPrice.textContent = "₹0";
      if (summarySnacksPrice) summarySnacksPrice.textContent = "₹0";
      if (summaryConvenienceFee) summaryConvenienceFee.textContent = "₹0";
      if (summaryGrandTotal) summaryGrandTotal.textContent = "₹0";
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Select Seats to Proceed";
      }
      if (selectedSeatsInput) selectedSeatsInput.value = "";
      return;
    }

    // Ticket calculation
    const ticketTotal = seatCount * seatRate;

    // Snacks calculation
    let snacksTotal = 0;
    Object.keys(selectedSnacks).forEach((k) => {
      snacksTotal += selectedSnacks[k].price * selectedSnacks[k].quantity;
    });

    // Convenience fee: ₹35 per seat + 18% GST
    const feePerSeat = 35;
    const convenienceFee = Math.round(seatCount * feePerSeat * 1.18);
    const grandTotal = ticketTotal + snacksTotal + convenienceFee;

    // Update UI Elements
    if (summarySeatsList) summarySeatsList.textContent = selectedSeats.join(", ");
    if (summaryTicketPrice) summaryTicketPrice.textContent = `₹${ticketTotal.toLocaleString("en-IN")}`;
    if (summarySnacksPrice) summarySnacksPrice.textContent = `₹${snacksTotal.toLocaleString("en-IN")}`;
    if (summaryConvenienceFee) summaryConvenienceFee.textContent = `₹${convenienceFee.toLocaleString("en-IN")}`;
    if (summaryGrandTotal) summaryGrandTotal.textContent = `₹${grandTotal.toLocaleString("en-IN")}`;

    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = `Pay ₹${grandTotal.toLocaleString("en-IN")} • Proceed`;
    }

    // Set Hidden Inputs
    if (selectedSeatsInput) selectedSeatsInput.value = selectedSeats.join(",");
    if (seatCategoryInput) seatCategoryInput.value = currentCategory;
    if (selectedSnacksInput) selectedSnacksInput.value = JSON.stringify(selectedSnacks);
  }
});
