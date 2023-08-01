setTimeout(() => {
  const myAtropos = Atropos({
    el: '.my-atropos',
    // activeOffset: 40,
    // shadowScale: 1.05,
    onEnter() {
      console.log('Enter');
    },
    onLeave() {
      console.log('Leave');
    },
    onRotate(x, y) {
      // console.log('Rotate', x, y);
    }
  });
  console.log(myAtropos);
}, 1000);


