console.log('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Date', new Date().toLocaleDateString(), new Date().toLocaleTimeString());
console.log(new Date(), new Date().getTime());
