import Script from 'next/script';

export type SchemaType = 'Quiz' | 'EducationalApplication' | 'SoftwareApplication';

interface SchemaMarkupProps {
    type: SchemaType;
    data: Record<string, any>;
}

export default function SchemaMarkup({ type, data }: SchemaMarkupProps) {
    const schemas = {
        Quiz: {
            '@context': 'https://schema.org',
            '@type': 'Quiz',
            ...data,
        },
        EducationalApplication: {
            '@context': 'https://schema.org',
            '@type': 'EducationalApplication',
            ...data,
        },
        SoftwareApplication: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            applicationCategory: 'EducationalApplication',
            ...data,
        },
    };

    return (
        <Script
            id={`schema-${type.toLowerCase()}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schemas[type]),
            }}
        />
    );
}
