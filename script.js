// ============================================
// NAVIGATION MOBILE (BURGER MENU)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.burger');
    const navMenu = document.querySelector('.nav-menu');

    if (burger && navMenu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Fermer le menu quand on clique sur un lien
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ============================================
    // ANIMATIONS AU SCROLL
    // ============================================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animer les cartes au scroll
    document.querySelectorAll('.quick-link-card, .staff-card, .rule-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // ============================================
    // PARTICULES (EFFET VISUEL HEADER)
    // ============================================

    const particlesContainer = document.querySelector('.particles');

    if (particlesContainer) {
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // ============================================
    // FORMULAIRE WHITELIST - ENVOI VERS DISCORD
    // ============================================

    const whitelistForm = document.getElementById('whitelistForm');

    if (whitelistForm) {
        whitelistForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Récupérer toutes les données du formulaire
            const formData = {
                pseudo: document.getElementById('pseudo')?.value || '',
                age: document.getElementById('age')?.value || '',
                roblox: document.getElementById('roblox')?.value || '',
                experience: document.getElementById('experience')?.value || '',
                nom: document.getElementById('nom')?.value || '',
                agePerso: document.getElementById('age-perso')?.value || '',
                maison: document.getElementById('maison')?.value || 'Aucune préférence',
                background: document.getElementById('background')?.value || '',
                motivation: document.getElementById('motivation')?.value || '',
                comment: document.getElementById('comment')?.value || '',
                scenario1: document.getElementById('scenario1')?.value || '',
                scenario2: document.getElementById('scenario2')?.value || ''
            };

            // Webhook Discord
            const webhookURL = 'https://discord.com/api/webhooks/1466897477704745015/g-o7oRLfaqg0rwiKlahwOdX0FU9Yau9NYcKGy9TLXUeWde_YT7AuZfeKEKYfXRRKsulD';

            // Créer l'embed Discord
            const embed = {
                embeds: [{
                    title: '📝 Nouvelle Demande de Whitelist',
                    color: 0x9b59b6, // Couleur violette magique
                    fields: [
                        {
                            name: '👤 Informations Personnelles',
                            value: `**Discord:** ${formData.pseudo}\n**Âge:** ${formData.age} ans\n**Roblox:** ${formData.roblox}\n**Expérience RP:** ${formData.experience}`,
                            inline: false
                        },
                        {
                            name: '📖 Personnage',
                            value: `**Nom:** ${formData.nom}\n**Âge:** ${formData.agePerso} ans\n**Maison préférée:** ${formData.maison}`,
                            inline: false
                        },
                        {
                            name: '📜 Background du Personnage',
                            value: formData.background.length > 1024 
                                ? formData.background.substring(0, 1021) + '...' 
                                : formData.background,
                            inline: false
                        },
                        {
                            name: '💭 Motivation',
                            value: formData.motivation.length > 1024 
                                ? formData.motivation.substring(0, 1021) + '...' 
                                : formData.motivation,
                            inline: false
                        },
                        {
                            name: '🔍 Découverte',
                            value: formData.comment,
                            inline: true
                        },
                        {
                            name: '🎭 Scénario 1 - Duel',
                            value: formData.scenario1.length > 1024 
                                ? formData.scenario1.substring(0, 1021) + '...' 
                                : formData.scenario1,
                            inline: false
                        },
                        {
                            name: '🎭 Scénario 2 - Passage Secret',
                            value: formData.scenario2.length > 1024 
                                ? formData.scenario2.substring(0, 1021) + '...' 
                                : formData.scenario2,
                            inline: false
                        }
                    ],
                    footer: {
                        text: 'School RP FR - Système de Whitelist'
                    },
                    timestamp: new Date().toISOString()
                }]
            };

            // Désactiver le bouton pendant l'envoi
            const submitButton = whitelistForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>⏳ Envoi en cours...</span>';

            try {
                // Envoyer vers Discord
                const response = await fetch(webhookURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(embed)
                });

                if (response.ok) {
                    // Succès
                    alert('✅ Candidature envoyée avec succès !\n\nNous traiterons ta demande dans les 24 à 72 heures.\n\nTu recevras une réponse sur Discord.');
                    whitelistForm.reset();
                } else {
                    // Erreur
                    throw new Error('Erreur lors de l\'envoi');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('❌ Une erreur est survenue lors de l\'envoi de ta candidature.\n\nVérifie ta connexion internet et réessaie.\n\nSi le problème persiste, contacte-nous sur Discord.');
            } finally {
                // Réactiver le bouton
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });

        // ============================================
        // VALIDATION DU FORMULAIRE
        // ============================================

        // Validation de l'âge du personnage
        const agePersoInput = document.getElementById('age-perso');
        if (agePersoInput) {
            agePersoInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value < 11 || value > 18) {
                    e.target.setCustomValidity('L\'âge doit être entre 11 et 18 ans');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }

        // Validation du background (minimum 200 mots)
        const backgroundInput = document.getElementById('background');
        if (backgroundInput) {
            backgroundInput.addEventListener('blur', (e) => {
                const text = e.target.value.trim();
                if (text.length > 0) {
                    const wordCount = text.split(/\s+/).length;
                    if (wordCount < 10) {
                        alert(`⚠️ Ton background est trop court !\n\nIl contient ${wordCount} mots, mais nous demandons au minimum 200 mots pour avoir suffisamment de détails sur ton personnage.`);
                    }
                }
            });
        }
    }

    // ============================================
    // SMOOTH SCROLL
    // ============================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ============================================
    // SCROLL INDICATOR (HOMEPAGE)
    // ============================================

    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        });

        // Cacher l'indicateur après scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '1';
            }
        });
    }

    console.log('🪄 School RP FR - Script chargé avec succès !');
});
