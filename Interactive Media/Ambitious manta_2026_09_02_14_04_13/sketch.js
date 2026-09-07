let canvas = {
  w: 400,
  h: 400
};

function setup() {
  createCanvas(canvas.w, canvas.h);
}

function draw() {
  background(220);
  draw_dude();
  //draw_in_order(0);
}

function draw_dude(pos_x = canvas.w/2, pos_y = canvas.h/2, size = 10){
  let head_size = 6*size;
  let body_len = 10*size;
  let body_wid = 5*size;
  let leg_gap = 1*size;
  let neck = pos_y - body_len + head_size/2;
  // Head
  fill("lightblue")
  circle(pos_x, pos_y - body_len, head_size);
  // Body
  fill("orange")
  rect(pos_x - body_wid/2, neck, body_wid, body_len)
  // Legs
  fill("lightblue")
  let leg1_w = pos_x - body_wid/2
  let leg2_w = pos_x - body_wid/2 + body_wid/2 + leg_gap/2
  let legs_h = body_wid/2 - leg_gap/2
  rect(leg1_w, neck + body_len, legs_h, body_len/2)
  rect(leg2_w, neck + body_len, legs_h, body_len/2)
  // arms
  fill("lightblue")
  let arm1_w = pos_x - body_wid + 5
  let arm2_w = pos_x + body_wid/2
  let arms_h = neck
  rect(arm1_w, arms_h, body_wid/2 - leg_gap/2, body_len/2)
  rect(arm2_w, arms_h, body_wid/2 - leg_gap/2, body_len/2)
}

function draw_in_order(i){
  if (i == 0){
    circle(180, 180, 200);
    rect(250, 200, 30, 100);
    line(180, 180, 300, 100)
  }
  else if (i == 1){
    rect(250, 200, 30, 100);
    circle(180, 180, 200);
    line(180, 180, 300, 100)
  }
}