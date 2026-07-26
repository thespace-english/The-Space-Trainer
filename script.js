/* FAVICON */
if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = "https://thespace-english.github.io/EGE/favicon.png";
    document.head.appendChild(favicon);
}

function openGeneral() {

    alert("SPACE GENERAL\n\nKids\nTeens");

}
