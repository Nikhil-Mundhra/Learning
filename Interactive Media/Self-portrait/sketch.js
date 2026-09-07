let canvas = {
  w: 400,
  h: 500
};
let theme = "light"

function checked_background(col1 = "#1130A0", col2 = "#580A50"){
  let x = 0;
  let r_color = col1;
  for (let y = 0; y < canvas.h; y += 5){
    r_color = (r_color == col2)? col1: col2;
    for (let x = 0; x < canvas.w; x += 5){
      r_color = (r_color == col2)? col1: col2;
      noStroke()
      fill(r_color);
      rect(x, y, 5, 5);
  }
  }
}

function setup() {
  createCanvas(canvas.w, canvas.h);
}

function draw() {
  background(220);
  draw_portrait(theme);
  //draw_in_order(0);
}

function draw_lamp(x, y, s = 0.2, theme = "light") {
  push();
  translate(x, y);
  scale(s);

  noStroke();

  // glow
  if (theme === "light") {
    fill(255, 224, 102, 50);
    circle(0, 0, 160);
    fill(255, 224, 102, 80);
    circle(0, 0, 120);
  }

  // bulb
  fill(theme === "light" ? "#FFE066" : "#E0E0E0");
  circle(0, 0, 50);

  // trapezoid
  fill(theme === "light" ? "#C2593F" : "#D47A60");
  quad(-35, -20, 35, -20, 55, 30, -55, 30);

  // stem
  fill(theme === "light" ? 60 : 140);
  rect(-4, 30, 8, 70);

  // foot
  rect(-30, 100, 60, 10, 4);

  pop();
}

function draw_portrait(theme = "dark"){
  if (theme === "dark") {
    checked_background("#131B2E", "#1A253D");
  } else {
    checked_background("#F8F5EE", "#EADECF");
  }
  //draw_head(canvas.w/2, canvas.h/2, 120, theme);
  draw_lamp(60, 270, 2, theme);
  draw_body(canvas.w/2 + 40, canvas.h/2 + 100, 20, theme)
}

function draw_head(pos_x = canvas.w/2, pos_y = canvas.h/2, size = 100, theme = "light"){
  push();
  translate(pos_x, pos_y);
  scale(0.9, 1.0); // 10% slimmer horizontally
  translate(-pos_x, -pos_y);
  
  // top hair
  fill("black")
  rect(pos_x - size*1.05, pos_y - size/2, size*2.1, size*0.5, 3);
  rect(pos_x - size*1, pos_y - size/1.8 - 2, size*2, size*0.1, 3);
  rect(pos_x - size*0.95, pos_y - size/1.7 - 2, size*1.9, size*0.1, 3);
  arc(pos_x, pos_y - size/1.7, size*1.9, size*0.5, PI, PI*2);

  // Face
  fill("khaki")
  ellipse(pos_x, pos_y + size/2, size*2, size*1.7)
  // chin
  ellipse(pos_x + size/50, pos_y + size*1.3, size/2, size/4)
  noFill()
  stroke(0.5)
  arc(pos_x + size/50, pos_y + size*1.7, size, size, PI*2-1.8, PI*2-1.3)

  // Side hair
  fill("black")
  ellipse(pos_x - size*0.9, pos_y + size*0.1, size/3.2, size/1.5);
  ellipse(pos_x + size*0.9, pos_y + size*0.1, size/3.2, size/1.5);

  // Eyes
  fill("black")
  circle(pos_x - size/3, pos_y + size/5, size/5)
  circle(pos_x + size/3, pos_y + size/5, size/5)
  if (theme == "dark"){
    noStroke()
    fill("#FFFFFF")
    circle(pos_x - size/2.7, pos_y + size/7 + 1, size/25)
    circle(pos_x + size/3.3, pos_y + size/7 + 1, size/25)
  }

  draw_specs(pos_x, pos_y, size, theme)

  if (theme == "dark"){
    noFill()
    arc(pos_x + size/50, pos_y + size/2, size, size, 0.5, 2.5)
  }
  if (theme == "light"){
    line(pos_x + size/50 - size/2, pos_y + size/2 + size/3, pos_x + size/2, pos_y + size/2 + size/3)
  }

  pop();
}

function draw_specs(pos_x, pos_y, size, theme = "light"){
  if (theme == "light"){
    fill("#00000080")
  } 
  if (theme == "dark") {
    fill("#00000030")
  }
  strokeWeight(3);
  stroke("#90D5FF");
  //quad(pos_x + size/10, pos_y - size/25 + 2, pos_x + size/7, pos_y - size/25 + 2 + size/2, pos_x + size/10 + size/2, pos_y - size/25 + 2 + size/2, pos_x + size/10 + size/2, pos_y - size/25 + 2, 3);
  rect(pos_x + size/10, pos_y - size/25 + 2, size/2, size/2, 3)
  rect(pos_x - size/1.7, pos_y - size/25 + 2, size/2, size/2, 3)
  
  stroke("#404040");        // stroke color
  strokeWeight(2); 
  line(pos_x - size/3, pos_y - size/25, pos_x + size/3, pos_y - size/25)
  line(pos_x - size/10, pos_y + size/8, pos_x + size/10, pos_y + size/8)
  line(pos_x + size/10 + size/2, pos_y + size/8, pos_x + size, pos_y + size/5)
  line(pos_x - size/1.7 - size/2.4, pos_y + size/5, pos_x - size/1.7, pos_y + size/8)
}

function draw_body(pos_x = canvas.w/2, pos_y = canvas.h/2, size = 10, theme){
  let head_size = 5*size;
  let body_len = 10*size;
  let body_wid = 10*size;
  let leg_gap = 1*size;
  let neck = pos_y - body_len + head_size*1.3;
  // Body
  fill("#00A0D0")
  rect(pos_x - body_wid/2, neck, body_wid, body_len)
  // Head
  draw_head(pos_x, pos_y - body_len, head_size, theme);
  // Legs
  fill("lightblue")
  let leg1_w = pos_x - body_wid/2
  let leg2_w = pos_x - body_wid/2 + body_wid/2 + leg_gap/2
  let legs_h = body_wid/2 - leg_gap/2
  rect(leg1_w, neck + body_len, legs_h, body_len/2)
  rect(leg2_w, neck + body_len, legs_h, body_len/2)
  // arms
  fill("lightblue")
  let arm_wid = 2 * size;
  let arm_len = body_len * 0.7; 
  let arm1_x = pos_x - body_wid / 2 - arm_wid; 
  let arm2_x = pos_x + body_wid / 2;
  let arms_y = neck;
  rect(arm1_x, arms_y, arm_wid, arm_len, 5);
  rect(arm2_x, arms_y, arm_wid, arm_len, 5);
  fill("khaki")
  rect(arm1_x, arms_y + arm_len, arm_wid, arm_len/8, 5);
  rect(arm2_x, arms_y + arm_len, arm_wid, arm_len/8, 5);
}

function mousePressed() {
  theme = (theme === "light") ? "dark" : "light";
}