class NavBar extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        let pageTitle = document.getElementById('title').textContent;

        let entries = [["./index.html", "Home"],
        ["./about-me.html", "About Me"],
        ["./journey.html", "My Journey"]];

        // PAGE LINKS
        for (let entry of entries) {

            let link;

            // IF ENTRY FOR CURRENT PAGE, DON'T ASSIGN LINK
            // ASSIGN TAG FOR JAVASCRIPT SCROLL
            if (entry[1] !== pageTitle) {
                link = `href="${entry[0]}"`;
            } else {
                link = `id="active"`;
            }

            // IF GALLERY PAGE, GENERATE ANCHOR FOR GALLERY LINKS
            if (pageTitle === entry[1] && entry[1] === "My Journey") {
                this.innerHTML += `<div id="dropdown" class="nav-item"><a ${link}>${entry[1]}</a>
                                        <div id="dropdown-menu" class="dropdown-menu">
                                        </div>
                                    </div>`;
                // this.innerHTML +=   `<div id="dropdown" class="nav-item"><a ${link}>${entry[1]}</a>
                //                         <div id="dropdown-menu" class="dropdown-menu">
                //                         </div>
                //                     </div>`;
            } else {
                this.innerHTML += `<div class="nav-item"><a ${link}>${entry[1]}</a></div>`;
            }
        }
    }
}
customElements.define('nav-bar', NavBar);