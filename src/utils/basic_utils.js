function to_epoch_ms(date) {
  function days_in_years(year) {
    return ( (year-1970) * 365 + Math.floor( (year-1971) / 4 ) );
  }
  const months_per_year = 12;
  function days_prior_to_month(month_idx) {
    let days = 0;
    let feb_days = (date.getFullYear() % 4 === 0)?29:28;
    switch (month_idx) {
      case 0:
        return days;
      case 1:
        days = 31; // January
        return days;
      case 2:
        days = 31 + feb_days; // January + February
        return days;
      case 3:
        days = 31 + feb_days + 31; // ...
        return days;
      case 4:
        days = 31 + feb_days + 31 + 30;
        return days;
      case 5:
        days = 31 + feb_days + 31 + 30 + 31;
        return days;
      case 6: 
        days = 31 + feb_days + 31 + 30 + 31 + 30;
        return days;
      case 7:
        days = 31 + feb_days + 31 + 30 + 31 + 30 + 31;
        return days;
      case 8:
        days = 31 + feb_days + 31 + 30 + 31 + 30 + 31 + 31;
        return days;
      case 9:
        days = 31 + feb_days + 31 + 30 + 31 + 30 + 31 + 31 + 30;
        return days;
      case 10:
        days = 31 + feb_days + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31;
        return days;
      case 11:
        days = 31 + feb_days + 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30;
        return days;
      default:
        return days;
    }
  }
  const hrs_per_day = 24;
  const mins_per_hr = 60;
  const seconds_per_min = 60;
  const ms_per_sec = 1000;
  return ( ( days_in_years(date.getFullYear())
                   + days_prior_to_month(date.getMonth())
                   + date.getDate() )
              * hrs_per_day * mins_per_hr * seconds_per_min * ms_per_sec
          + date.getHours() * mins_per_hr * seconds_per_min * ms_per_sec
          + date.getMinutes() * seconds_per_min * ms_per_sec
          + date.getSeconds() * ms_per_sec
          + date.getMilliseconds() );
}

module.exports = {
  to_epoch_ms
}
