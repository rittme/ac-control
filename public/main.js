const toast = (text) => {
  Toastify({
    text,
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
  }).showToast();
}

(async () => {
  // Schedule
  const scheduleBtn = document.getElementById('schedule-btn');
  const scheduleSelect = document.getElementById('schedule-select');
  const scheduleMsg = document.getElementById('schedule-message');
  scheduleMsg.innerHTML = 'No shutdown scheduled';

  // scheduleSelect.addEventListener('change', (e) => {
  //   e.target.value;
  // })

  let run_at = null;

  const run_timer = () => {
    if (!run_at) {
      scheduleMsg.innerHTML = "No shutdown scheduled";
      return;
    }
    scheduleMsg.innerHTML = humanizeDuration(Date.now() - run_at, {round: true});
    setTimeout(run_timer, 1000);
  };

  (async () => {
    const res = await fetch(`/gettimer`);
    const json = await res.json();
    if (json && json.run_at) {
      run_at = new Date(Date.parse(json.run_at));
      run_timer();
    }
  })();

  scheduleBtn.addEventListener('click', async () => {
    const minutes = scheduleSelect.value;
    const res = await fetch(`/schedule?time=${minutes}`);
    const json = await res.json();
    
    if (!json) {
      scheduleMsg.innerHTML = "No shutdown scheduled";
      run_at = null;
    } else if (json.error) {
      console.error(json.error);
      run_at = null;
    } else if (json.message && json.message == "done") {
      scheduleMsg.innerHTML = "No shutdown scheduled";
      run_at = null;
      toast('Shutdown unscheduled');
    } else {
      run_at = new Date(Date.parse(json.run_at));
      run_at.setMilliseconds = 0;
      run_timer();
      toast(`Shutdown scheduled in ${humanizeDuration(Date.now() - run_at, {round: true})}`)
    }
  });

  // Command

  const commandBtnsWrapper = document.getElementById('command-buttons-group');

  commandBtnsWrapper.addEventListener('click', async (e) => {
    const command = e.target.dataset.command; 
    if (command) {
      const res = await fetch(`/command?command=${command}`);
      const json = await res.json();

      if (json.message) {
        toast(json.message);
      } else {
        toast("Something wrong happened");
      }
    }
  });

  // temp update

  const tempLabel = document.getElementById('temp');
  const humLabel = document.getElementById('hum');
  
  const setTemp = async () => {
    const res = await fetch('/temp');
    const {temp, humidity} = await res.json();
    if (res.ok && (temp || humidity)) {
      tempLabel.innerHTML = temp || 'N/A';
      humLabel.innerHTML = humidity || 'N/A';
    }
    setTimeout(setTemp, 5000);
  }
  setTemp();
})();