function getDaysOfMonthWithDay(date) {
    const currentDate = date || new Date(); // If no date is provided, use current date
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
  
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get total days in the month
  
    const daysArray = [];
  
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const formattedDate = formatDate(day);
      daysArray.push({
        date: formattedDate,
        dayName: getDayName(day.getDay())
      });
    }
  
    return daysArray;
  }
  
  function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }
  
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  module.exports= getDaysOfMonthWithDay