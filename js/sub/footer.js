class Footer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(){
        // let pageTitle = document.getElementById('title').textContent;

        let entries = [["https://www.linkedin.com/in/richard-truchanowicz/", "LinkedIn Icon", "./img/icons/linkedin.png"],
                       ["https://github.com/rtruc/", "Github Icon", "./img/icons/github.png"]];

        for(let entry of entries) {
            this.innerHTML += `
                <div class="footer-item">
                    <a href="${entry[0]}">
                        <img class="icon" alt="${entry[1]}" src="${entry[2]}">
                    </a>
                </div>`
        }

    }
}
customElements.define('foot-bar', Footer);