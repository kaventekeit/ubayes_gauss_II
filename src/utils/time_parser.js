/* forms of time the time parser should be able to take: */


/*

`!x time set 8:00` 
`!x time set 7:00pm` 
`!x time set GMT` 
`!x time set America/Chicago [?]` 
`!x time convert`                     [prints the current time as UTC] 
`!x time convert 12:00pm`             [prints what time 12:00pm my time is, in UTC] 
`!x time convert 3:00pm Asia/Kolkata to my time`
`!x time convert 16:30 EST to UTC`
`!x remindme Dec. 9, 2022 celebrate`  [defaults to 12:00am my time] 
`!x remindme 2022 December 9 8:00am UTC celebrate`
`!x remindme 2023-09-13 2am MT eat leaves`
`!x remindme 12 October 2023 holy shit you're 23 that's ancient LMAO`
`!x remindme 2025 May 1 23:00:01 MT how're the paperclips out there`
`!x remindme 2022-08-05T12:00:01 ;)`

`!x election create Modiator start<31 August 2022 3:30pm MT> end<12:30pm September 1 2022 5:00pm MT> Multiaxial#3818 FindTheGenes#2537`
`!x election create Modiator 31 August 2022 3:30pm MT 2022-09-01T05:00:00-500 Multiaxial#3818 FindTheGenes#2537`

[^ should attempt to parse naked dates but templates are encouraged for both ease and reliability]

*/
