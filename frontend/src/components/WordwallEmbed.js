import { Alert, Box, Button } from "@mui/material";
import { validateWordwallEmbedUrl } from "../utils/wordwallUrl";

/**
 * Renders a fixed Wordwall iframe only after validating the stored URL.
 * The fallback opens the same approved URL in a separate tab.
 */
const WordwallEmbed = ({ title, embedUrl, height = "min(68vh, 600px)" }) => {
    let safeEmbedUrl;

    try {
        safeEmbedUrl = validateWordwallEmbedUrl(embedUrl);
    } catch {
        return (
            <Alert severity="warning">
                This activity does not contain a supported Wordwall embed URL.
            </Alert>
        );
    }

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <iframe
                title={title || "Wordwall activity"}
                src={safeEmbedUrl}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="fullscreen"
                allowFullScreen
                style={{
                    display: "block",
                    width: "100%",
                    height,
                    border: 0,
                    borderRadius: 8,
                    background: "#FFFFFF",
                }}
            />
            <Button
                component="a"
                href={safeEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 1, textTransform: "none" }}
            >
                Open on Wordwall
            </Button>
        </Box>
    );
};

export default WordwallEmbed;
