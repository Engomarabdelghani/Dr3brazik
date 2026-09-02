import { useEffect } from 'react';

interface SeoOptions {
    title?: string;
    description?: string;
    canonical?: string;
    robots?: string;
    path?: string;
    noindex?: boolean;
    image?: string;
}

export function useSeo({
    title,
    description,
    canonical,
    robots,
    path,
    noindex,
    image,
}: SeoOptions) {
    const effectiveRobots = noindex ? 'noindex, nofollow' : robots ?? 'index, follow';
    const effectiveCanonical = canonical ?? (path && typeof window !== 'undefined' ? `${window.location.origin.replace(/\/$/, '')}${path}` : undefined);
    useEffect(() => {
        if (title) {
            document.title = title;
        }

        if (description) {
            let metaDescription = document.querySelector(
                'meta[name="description"]'
            ) as HTMLMetaElement | null;

            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }

            metaDescription.content = description;
        }

        if (effectiveRobots) {
            let metaRobots = document.querySelector(
                'meta[name="robots"]'
            ) as HTMLMetaElement | null;

            if (!metaRobots) {
                metaRobots = document.createElement('meta');
                metaRobots.name = 'robots';
                document.head.appendChild(metaRobots);
            }

            metaRobots.content = effectiveRobots;
        }

        if (effectiveCanonical) {
            let canonicalLink = document.querySelector(
                'link[rel="canonical"]'
            ) as HTMLLinkElement | null;

            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.rel = 'canonical';
                document.head.appendChild(canonicalLink);
            }

            canonicalLink.href = effectiveCanonical;
        }

        if (image) {
            let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.content = image;

            let twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement | null;
            if (!twitterImage) {
                twitterImage = document.createElement('meta');
                twitterImage.name = 'twitter:image';
                document.head.appendChild(twitterImage);
            }
            twitterImage.content = image;
        }
    }, [title, description, canonical, robots, path, noindex, image]);
}