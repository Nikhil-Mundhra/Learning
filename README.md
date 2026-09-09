<div align="center">

<img src="./assets/nyu_tandon_logo.png" alt="NYU Tandon School of Engineering" width="400" />

# Nikhil Mundhra
### Software Engineering & Computer Science Portfolio

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mundhra-nikhil/)
[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nikhil-Mundhra)
[![Email](https://img.shields.io/badge/Email-nikhilmundhra28%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:nikhilmundhra28@gmail.com)
[![NYU Tandon](https://img.shields.io/badge/NYU%20Tandon-Computer%20Science-57068c?style=for-the-badge&logo=newyorkuniversity&logoColor=white)](https://engineering.nyu.edu/)

<br />

*Welcome to my coursework and engineering portfolio. This repository showcases my full-stack web applications, game engines, interactive creative computing, and low-level systems & data structures work from NYU Tandon and independent learning.*

</div>

---

## 🛠️ Tech Stack

### Languages
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![C++](https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)
![C](https://img.shields.io/badge/C-A8B9CC?style=for-the-badge&logo=c&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![GML](https://img.shields.io/badge/GML-000000?style=for-the-badge&logo=gamemaker&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend & Web Engineering
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![REST API](https://img.shields.io/badge/REST_API-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

### Databases
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)

### Tools & Creative Tech
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5dotjs&logoColor=white)

---

## 📌 Featured Projects

| Project | Domain | Stack | Highlights |
| :--- | :--- | :--- | :--- |
| [**Cool Reminders**](./Applied%20Internet%20Technology/final-project-Nikhil-Mundhra) | Full-Stack Web App | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white) | Dynamic priority reminders, real-time WebSocket updates, subtasks, custom theming, and secure session authentication. |
| [**SmogLife**](./Gamified%20Learning/SmogLife%20GameMaker) | Game Development | ![GML](https://img.shields.io/badge/GML-000000?style=flat-square&logo=gamemaker&logoColor=white) | 2D educational game raising environmental awareness with interactive gameplay mechanics and puzzle design. |
| [**Interactive Creative Computing**](./Interactive%20Media) | Creative Computing | ![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=flat-square&logo=p5dotjs&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Generative art sketches and responsive interactive self-portrait built with the p5 canvas library. |
| [**Core Data Structures & Algorithms**](./Data_Structures) | Systems & DS | ![C++](https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white) ![C](https://img.shields.io/badge/C-A8B9CC?style=flat-square&logo=c&logoColor=white) | Custom implementations of Binary Search Trees (BST), Max Heaps, and Hash Tables with collision resolution. |
| [**NYUAD QC Hackathon Showcase**](./NYUAD_QC_Hackathon) | Quantum Computing | ![NYUAD](https://img.shields.io/badge/NYUAD-Quantum-57068c?style=flat-square) | Quantum Computing Hackathon project exploration and nomination showcase at NYU Abu Dhabi. |

---

## 🚀 Deep Dives into Projects

### 1. Cool Reminders — Full-Stack Productivity & Task Engine
> **Path**: [`Applied Internet Technology/final-project-Nikhil-Mundhra`](./Applied%20Internet%20Technology/final-project-Nikhil-Mundhra)

A full-stack productivity web application designed to eliminate task clutter with structured hierarchies, real-time notifications, and personalized workflows:

```mermaid
graph LR
    subgraph Client["Frontend Client (Browser)"]
        UI["Modern UI / Theme Engine"]
    end

    subgraph Server["Backend Application (Express.js)"]
        API["REST Endpoints / Routes"]
        WS["Socket.io Notification Service"]
        Auth["Session Auth & Password Hashing"]
    end

    subgraph Database["Data Layer (MongoDB)"]
        Mongo[("MongoDB Database\n(Users, Lists, Tasks, Tags)")]
    end

    UI <-->|"HTTP Requests"| API
    UI <-->|"Real-Time Push"| WS
    API --> Auth
    API <-->|"Mongoose ODM"| Mongo
```

- **Backend Architecture**: Express.js REST API with asynchronous ES Modules (`.mjs`), clean routing, and centralized database connection pooling.
- **Data Persistence**: MongoDB database modeled with Mongoose schemas for users, lists, hierarchical subtasks, tags, and settings.
- **Real-Time Communication**: Socket.io integration for instant client notification dispatch without polling.
- **Security & Auth**: Hashed credential management, session handling, input sanitation, and scoped user permissions.
- **Customization Engine**: Dynamic user preferences supporting custom theme colors, reminder offsets, and prioritized layout ordering.

---

### 2. SmogLife — Gamified Learning & Environmental Simulation
> **Path**: [`Gamified Learning/SmogLife GameMaker`](./Gamified%20Learning/SmogLife%20GameMaker)

An interactive 2D narrative game built to teach atmospheric science and pollution mitigation through playful mechanics:

<div align="center">
  <img src="./assets/smoglife-sprites.webp" alt="SmogLife Character Sprite Animations" width="75%" />
  <p><em>SmogLife Character Animation & Directional Sprite Sequence</em></p>
</div>

- **Dynamic Mechanics**: Multi-level game progression across custom rooms and obstacle challenges.
- **State Tracking**: Real-time environmental metrics, player energy systems, and win/loss trigger conditions.
- **Asset Pipeline**: Custom 2D pixel art, animated directional sprite engines, and immersive audio effects.

---

### 3. Core Data Structures & Systems Engineering
> **Path**: [`Data_Structures`](./Data_Structures) & [`CSO`](./CSO)

High-performance C and C++ software demonstrating foundational algorithmic complexity and memory models:

```mermaid
graph TD
    Input["📄 Raw Text Corpus"] --> Parser["Frequency Tokenizer"]
    Parser -->|"Near O(1) Avg"| Hash["🗂️ Hash Table (Separate Chaining)"]
    Hash -->|"Insert Node Entries"| Heap["🌲 Max Heap Priority Queue"]
    Heap -->|"Extract Max O(k log n)"| TopK["📊 Top-K Frequency Insights"]
```

- **Library Circulation Management System (LCMS)**: Custom Binary Search Tree (BST) supporting dynamic insertions, deletions with successor replacement, and tree traversals in C++.
- **Frequency Analyzer**: Custom Hash Table paired with a Max Heap priority queue for high-speed top-$k$ statistical analysis.
- **Low-Level Systems (CSO)**: Pointer arithmetic, dynamic memory allocation (`malloc`/`free`), bit manipulation, and machine-level architecture in C.

---

### 4. Interactive Media & Creative Computing
> **Path**: [`Interactive Media`](./Interactive%20Media)

Creative programming projects exploring canvas manipulation and algorithmic graphics:
- **Interactive Self-Portrait**: Interactive sketch rendering dynamic geometry responding to user inputs and cursor movements.
- **Generative Sketches**: Algorithmic rendering and animation with p5.js.

---

## 📂 Repository Organization

```text
.
├── assets/                          # Authentic institution logos & project media
│   ├── nyu_tandon_logo.png          # Official NYU Tandon School of Engineering logo
│   ├── nyuad_logo.svg               # Official NYU Abu Dhabi logo
│   └── smoglife-sprites.webp        # SmogLife character animation sheet
├── Applied Internet Technology/     # Full-stack web engineering
│   ├── final-project-Nikhil-Mundhra # "Cool Reminders" flagship full-stack web app
│   ├── homework01-Nikhil-Mundhra    # Interactive CLI Tic-Tac-Toe engine
│   ├── homework02-Nikhil-Mundhra    # Express web server & data visualization
│   ├── homework03-Nikhil-Mundhra    # Client-server web app
│   └── Practice/                    # React, Socket.io, AJAX, and auth prototypes
├── Gamified Learning/               # Game design & educational tech
│   └── SmogLife GameMaker/          # Full GameMaker Studio game project
├── Interactive Media/               # Creative coding & p5.js sketches
│   ├── Self-portrait/               # Interactive graphical self-portrait
│   └── Ambitious manta_*/           # Generative canvas exploration
├── Data_Structures/                 # C++ data structures & memory management
│   ├── Assignment2/                 # Binary Search Tree library system (lcms)
│   └── Assignment3/                 # Hash Table & Max Heap word analyzer
├── CSO/                             # Computer Systems Organization in C
│   ├── HW2/                         # Bit-level operations & machine architecture
│   └── Recitations/                 # Systems programming exercises & pointer manipulation
├── Algorithms/                      # Algorithm analysis & design problem sets
├── Operating Systems/               # OS concepts, processes, concurrency & memory
├── Computer Networking/             # Networking protocols & layer architectures
├── Computer Security/               # Information security, privacy & cryptography
├── NYUAD_QC_Hackathon/              # Quantum computing hackathon project & showcase
└── java/                            # Java object-oriented programming foundations
```

---

## 🛠️ Getting Started & Local Setup

### Running "Cool Reminders" (Full-Stack Web App)
```bash
cd "Applied Internet Technology/final-project-Nikhil-Mundhra"
npm install
# Ensure MongoDB is running locally (e.g., mongodb://localhost:27017)
# or set DSN in your .env file:
# DSN=mongodb://localhost:27017/cool-reminders
npm start
```

### Running Data Structures Projects (C++)
```bash
# Example: Binary Search Tree Library System
cd "Data_Structures/Assignment2/nm4358"
g++ -std=c++11 -Wall *.cpp -o lcms
./lcms

# Example: Hash Table & Max Heap Word Counter
cd "Data_Structures/Assignment3/nm4358"
g++ -std=c++11 -Wall *.cpp -o wordcount
./wordcount
```

### Running Interactive Media (p5.js)
Open `Interactive Media/Self-portrait/index.html` directly in any modern web browser or serve via:
```bash
npx serve "Interactive Media/Self-portrait"
```

---

## 📫 Connect With Me

| Platform | Link |
|---|---|
| 💼 LinkedIn | [linkedin.com/in/mundhra-nikhil](https://www.linkedin.com/in/mundhra-nikhil/) |
| 🐙 GitHub | [github.com/Nikhil-Mundhra](https://github.com/Nikhil-Mundhra) |
| 📧 Email | [nikhilmundhra28@gmail.com](mailto:nikhilmundhra28@gmail.com) |
