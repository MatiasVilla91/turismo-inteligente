function Footer() {
    return (
        <footer className="bg-dark text-white text-center py-4">
            <div className="container">
                <p>&copy; 2025 Turismo Inteligente. Todos los derechos reservados.</p>
                <p>
                    <a href="mailto:contacto@turismointeligente.com" className="text-light text-decoration-none">
                        contacto@turismointeligente.com
                    </a>
                    {" | "}
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none">
                        LinkedIn
                    </a>
                    {" | "}
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none">
                        GitHub
                    </a>
                </p>
            </div>
        </footer>
    );
}

export default Footer;
