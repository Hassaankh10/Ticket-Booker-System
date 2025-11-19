const generateSeatNumbers = (quantity = 1) => {
  const seats = [];
  for (let i = 0; i < quantity; i += 1) {
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 10));
    const seat = Math.floor(Math.random() * 50) + 1;
    seats.push(`${row}${seat}`);
  }
  return seats;
};

module.exports = {
  generateSeatNumbers,
};


