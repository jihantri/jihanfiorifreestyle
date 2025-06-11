using from '../../../srv/index';

annotate MainService.Tasks with @title: '{i18n>TaskRuntime}' {
    name        @Common.Label         : '{i18n>TaskName}';
    description @Common.Label         : '{i18n>Description}';
    sequence    @Common.Label         : '{i18n>Sequence}';
    contextPath @Common.Label         : '{i18n>ContextPath}';
};

annotate MainService.BotInstances with {
    sequence @Common.Label: '{i18n>Sequence}';
    result   @Common.Label: '{i18n>Result}';
    status   @Common.Label: '{i18n>Status}';
};

annotate MainService.ContextNodes with {
    path  @Common.Label: '{i18n>Path}';
    type  @Common.Label: '{i18n>Type}';
    label @Common.Label: '{i18n>Label}';
    value @Common.Label: '{i18n>Value}';
};

annotate MainService.createTaskWithBots with  @title       : '{i18n>CreateTaskWithBots}'  (name  @Common.Label: '{i18n>TaskName}',
description                                   @Common.Label: '{i18n>Description}',
typeId                                        @Common.Label: '{i18n>TypeID}' );
