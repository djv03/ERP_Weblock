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

  function totalDaysInMonth(year, month) {
    // JavaScript months are zero-based (0 = January, 1 = February, etc.)
    // So, to get the last day of a month, set the day to 0 of the next month
    return new Date(year, month + 1, 0).getDate();
}

function countSundays(year, month) {
  // Get the day of the week for the first day of the month (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate the number of complete weeks
  const completeWeeks = Math.floor((daysInMonth + firstDayOfWeek) / 7);

  // Calculate the number of remaining days after complete weeks
  const remainingDays = (daysInMonth + firstDayOfWeek) % 7;

  // Check if the remaining days include a Sunday
  let sundays = completeWeeks;
  if (remainingDays > 0 && (firstDayOfWeek + remainingDays) % 7 === 0) {
      sundays++;
  }

  return sundays;
}

  
  module.exports= {getDaysOfMonthWithDay,totalDaysInMonth,countSundays}