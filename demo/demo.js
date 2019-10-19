const getQueryValue = (key, defaultValue) => {
  let value = defaultValue;
  if (!window.location.search) return value;
  window.location.search.split(/[?&]/).forEach(s => {
    const parts = s.split("=").map(decodeURIComponent);
    if (parts[0] !== key) return;
    value = parts[1];
  });
  return value;
};
