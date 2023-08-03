const assistantHistory = {};
const assistantCooldowns = {};


export function addToAssistantHistory(channel, message, username) {
  if (!assistantHistory[channel]) {
    assistantHistory[channel] = [];
  }
  assistantHistory[channel].push({ username, message });
  if (assistantHistory[channel].length > 16) {
    assistantHistory[channel].shift();
  }
}

export function getAssistantHistory(channel) {
  return assistantHistory[channel] || [];
}

export function clearAssistantHistory(channel) {
  if (assistantHistory[channel]) {
    delete assistantHistory[channel];
  }
}


export const setAssistantCooldown = (channel, cooldownSeconds) => {
  if (!assistantCooldowns[channel]) {
    assistantCooldowns[channel] = {};
  }
  assistantCooldowns[channel] = Date.now() + cooldownSeconds * 1000;
};

export const getAssistantCooldown = (channel) => {
  if (!assistantCooldowns[channel]) {
    return 0;
  }
  return assistantCooldowns[channel] - Date.now();
};

export const isAssistantOnCooldown = (channel, username) => {
  if (username && username.toLowerCase() === 'alexitoo_uy') {
    return false;
  }
  return getAssistantCooldown(channel) > 0;
};