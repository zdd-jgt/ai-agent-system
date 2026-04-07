export const getTimeTool = {
    name: "get_current_time",
    description: "获取当前系统时间",
    parameters: {
        type: "object",
        properties: {
            timezone: {
                type: "string",
                description: "时区，比如 Asia/Shanghai",
            },
        },
        required: [],
    },
    execute: async({timezone} : {timezone?: string}) => {
        if (timezone) {
            return new Date().toLocaleString("en-US", {
                timeZone: timezone,
            });
        }
        return new Date().toLocaleString();
    }
}