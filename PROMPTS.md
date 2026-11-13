# Prompts Log

**IDE:** OpenCode (agentic coding CLI) · prompts are listed in chronological order.

## 2026-11-13 13:29:52 PKT

> please add this in your rules you have to log every prompt in PROMPTS.md on root of project

## 2026-11-13 13:44:50 PKT

> I attached the PDF in which you will find complete detail about the project and I also attached the screenshot of project how it will look like (UI/UX), now you need to create a complete plan and break plan into smaller steps and I will review the each step and give you a feedback or go ahead for a next step.
>
> - we will use tailwind CSS v4
> - Axios for a api call
> - create a single constant file to manage all constants in project
> - DO not over engineer, this is very simple and easy project
> - code should be easy to understand and maintain
> - add short and understandable code
> - do not make lots thin function, create a utils file for repeated function or code
> - in plan first add UI/UX, functionality then include local storage / offline mode, PWA
>
> Attached file: `/home/ahsan/Downloads/Edspire-Frontend-Technical-Challenge.pdf`
> Attached image: WeatherBoard UI/UX screenshot (light theme, sidebar + main weather panel)

## 2026-11-13 13:49:25 PKT

> 1. yes
> 2. okay
> 3. keep it visible
> 4. vercel

## 2026-11-13 13:57:09 PKT

> for icons use lucide-react
>
> for icons use lucide-react and move to next step

## 2026-11-13 14:03:31 PKT

> tested now move to next step

## 2026-11-13 14:10:52 PKT

> responsive tested and working fine, now let's move to next step

## 2026-11-13 14:15:14 PKT

> for axios you need to create a interceptor files and use this

## 2026-11-13 14:19:50 PKT

> do not directly create all files root of src folder create lib or helper folder and move all files there in there own folders constants, types, utils etc,

## 2026-11-13 14:21:40 PKT

> and move to next step

## 2026-11-13 14:59:03 PKT

> tested working fine, let's move to next step

## 2026-11-13 15:09:33 PKT

> tested and working fine, let's move to next step

## 2026-11-13 15:15:04 PKT

> dark mode and C/°F working fine, let's move to next step

## 2026-11-13 15:28:12 PKT

> go ahead

## 2026-11-13 15:43:55 PKT

> I noticed you're not added comments, you need to add proper short and understandable comments.
>
> PWA working fine and let's move to next step

## 2026-11-13 16:01:58 PKT

> here is my feedback, please work on these
>
> - in search field add a cross icon to clear the fiels
> - all clickable items should be pointer cursor
> - move to "Morning reminder" section top and "Favourites" section below the "Morning reminder"
> - improve the "Remind me at" ui
> - when user click the button "Allow notifications" then open the browser notitification permission modal for user
> - user user click on the notification it should be navigate to the web

## 2026-11-13 16:08:46 PKT

> - on remind me nothing happen when I l clicked on time
> - currently we are using native modal when removing favorite, please create a modal with consist with our design language

## 2026-11-13 16:16:12 PKT

> - please improve the select time ui, currently when I click on time the modal of time open to the left side

## 2026-11-13 16:35:00 PKT

> - now please review the complete code base and match with then plan did all we complete the plan instead of steps 11
> - is project completed as mention in the project description in pdf file

## 2026-11-13 16:48:05 PKT

> I deployed project on vercel, let's start work on step 11

## 2026-11-13 16:58:20 PKT

> I tested the notification and there is issue in notification it only works 1 time after that I change time and wat for a notification but nothing happened

## 2026-11-13 17:06:44 PKT

> currently "Send test notification" button in sidebar move this button in "Preview states"

## 2026-11-13 17:14:13 PKT

> why sending two request per api, same api with same response then why two api call and in forecast api why too much data in response are we need that much data?

## 2026-11-13 17:19:43 PKT

> I already tested this in prod, as you mention is only happening on dev then why happending on prod

## 2026-11-13 17:46:05 PKT

> run npm lint and npm build

## 2026-11-13 18:44:22 PKT

> now let's say if I schedule the notification to 6:35 then notification not show and then go and select 6:38 and current time is 6:37 then notifcation show

## 2026-11-13 20:01:37 PKT

> do not show the "Remind me at" if notification toggle is off

## 2026-11-13 20:03:44 PKT

> currently I am noticing the app icon is not consist, please make sure icon is consist throughout the app
