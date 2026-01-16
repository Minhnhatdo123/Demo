import { Movia } from "./src/movia.js";

hljs.initHighlightingOnLoad();
// Basic Modal
const modal1Btn = document.querySelector(".js-movia-modal-1");

const modal1 = new Movia({
    templateId:"modal-1",
    content: `
        <h1> Basic Modal </h1>
        <p>This is a simple modal.</p>
    `,
    closeMethods: ["button", "overlay", "escape"],
    destroyOnClose:false,
    enableScrollLock:false, // Tắt khóa cuộn trang cho modal này
    scrollLockTarget: () => {
        return document.querySelector('.wrapper');
    } // Chỉ định mục tiêu khóa cuộn trang riêng cho modal này
});

modal1Btn.addEventListener("click", () => {
    modal1.open();
});

// Modal with Buttons
const modal2Btn = document.querySelector(".js-movia-modal-2");

const modal2 = new Movia({
    content: `  
        <h1> Modal with Buttons </h1>
        <p>This modal has buttons in the footer.</p>
    `,
    closeMethods: ["button", "overlay", "escape"],
    footer: true,
    destroyOnClose:false,
});

modal2.addFooterButton({
    label: "Cancel",
    classNames: "modal-btn",
    onClick: () => {
        modal2.close();
    }
})
modal2.addFooterButton({
    label:"Confirm",
    classNames:"modal-btn primary",
    onClick: () => {
        confirm("Action confirmed!");
        modal2.close();
    }
});
modal2Btn.addEventListener("click", () => {
    modal2.open();
});

// Large Content Modal
const modal3btn = document.querySelector(".js-movia-modal-3");

const modal3 = new Movia({
    enableScrollLock: true,
    content: `
      <h1>Large Content Modal</h1>
      <p>This modal contains a large amount of content, suitable for displaying extended text or information.</p>
      <p>Please scroll down to view the entire content.</p>
      <p>The content can include multiple paragraphs, images, or other detailed information.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil cumque adipisci mollitia voluptatibus explicabo non perspiciatis eaque sed qui. Est.</p>
    `,
    destroyOnClose:false,
    })

modal3btn.addEventListener("click", () => {
    modal3.open();
})

// Footer-Only Close Modal
const modal4btn = document.querySelector(".js-movia-modal-4");  
const modal4 = new Movia({
    content: `  
      <h1> Footer-Only Close Modal </h1>
      <p>This modal can only be closed via the button in the footer for a controlled experience.</p> 
      `,
    footer: true,
    destroyOnClose:false,
});

modal4.addFooterButton({
    label: "Close",
    classNames: "modal-btn",
    onClick: () => {
        modal4.close();
    },
    closeMethods: [],
}); 
modal4btn.addEventListener("click", () => {
    modal4.open();
});

// Persistent Modal (Stays in DOM)
const modal5btn = document.querySelector(".js-movia-modal-5");
const modal5 = new Movia({
    content: `  
    <h1> Persistent Modal </h1>
    <p>This modal stays in the DOM even after being closed, allowing you to reopen it without losing any changes.</p>
    <p>You can write something in the input below, close the modal, and reopen it to see the content still intact.</p>
    <input type="text" placeholder="Type something here..." style="width: 100%; padding: 8px; margin-top: 10px;" />
    `,
    destroyOnClose: false,
});

modal5btn.addEventListener("click", () => {
    modal5.open();
});

// Multiple Modals
const modal6btn = document.querySelector(".js-movia-modal-6");
const modal6 = new Movia({
    content: `  
        <h1>Multiple Modals - First Modal</h1>
        <p>This modal demonstrates interaction between multiple modals.</p>
        <button class="btn js-open-basic-modal">Open Basic Modal</button>
    `,
    destroyOnClose:false,
    onOpen() {
        const btn = this.backdrop.querySelector(".js-open-basic-modal");
        if (!btn) return;

        btn.onclick = () => {
            modal1.open();
        };
    }
});    
modal6btn.addEventListener("click", () => {
    modal6.open();
});

// YouTube Embed Modal
const modal7btn = document.querySelector(".js-movia-modal-7");
const modal7 = new Movia({
    content: `<iframe
    width="100%"
    height="315"
    src="https://www.youtube.com/embed/9EDZixuODrw?list=RD9EDZixuODrw&start_radio=1"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
    </iframe>`,
    destroyOnClose:false,
});

modal7btn.addEventListener("click", () => {
    modal7.open();
});