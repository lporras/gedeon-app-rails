//= require active_admin/base
//= require activeadmin_addons/all
//= require stimulus
//= require controllers

const application = Stimulus.Application.start()

application.register("hello", HelloController)
application.register("scripture-form", ScriptureFormController)
application.register("ckeditor", CkeditorController)
application.register("schedule-editor", ScheduleEditorController)