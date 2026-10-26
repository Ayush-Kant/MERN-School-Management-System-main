import styled from "styled-components";
import { Button } from "@mui/material";

const BaseButton = `
&&{
    border-radius:14px;
    padding:10px 22px;
    font-weight:600;
    text-transform:none;
    letter-spacing:.3px;
    transition:.25s ease;
    box-shadow:none;

    &:hover{
        transform:translateY(-2px);
    }
}
`;

/* ===========================
   PRIMARY
=========================== */

export const BlueButton = styled(Button)`
${BaseButton}

&&{
    background:#2563EB;
    color:#F8FAFC;

    &:hover{
        background:#1D4ED8;
        box-shadow:0 8px 22px rgba(37,99,235,.35);
    }
}
`;

/* Used by Login/Register */

export const LightPurpleButton = styled(Button)`
${BaseButton}

&&{
    background:#2563EB;
    color:#fff;

    &:hover{
        background:#1D4ED8;
        box-shadow:0 8px 22px rgba(37,99,235,.35);
    }
}
`;

/* ===========================
   SECONDARY
=========================== */

export const PurpleButton = styled(Button)`
${BaseButton}

&&{
    background:#111827;
    color:#F8FAFC;
    border:1px solid #1E293B;

    &:hover{
        background:#172033;
        border-color:#2563EB;
    }
}
`;

export const BlackButton = styled(Button)`
${BaseButton}

&&{
    background:#0B1220;
    color:#F8FAFC;
    border:1px solid #1E293B;

    &:hover{
        background:#111827;
        border-color:#2563EB;
    }
}
`;

/* ===========================
   GOLD
=========================== */

export const BrownButton = styled(Button)`
${BaseButton}

&&{
    background:#FBBF24;
    color:#111827;
    font-weight:700;

    &:hover{
        background:#F59E0B;
        box-shadow:0 8px 22px rgba(251,191,36,.35);
    }
}
`;

/* ===========================
   DELETE
=========================== */

export const RedButton = styled(Button)`
${BaseButton}

&&{
    background:#7F1D1D;
    color:white;

    &:hover{
        background:#991B1B;
    }
}
`;

export const DarkRedButton = styled(Button)`
${BaseButton}

&&{
    background:#5F1515;
    color:white;

    &:hover{
        background:#7F1D1D;
    }
}
`;

/* ===========================
   SPECIAL
=========================== */

/* Reserved for analytics/charts only */

export const IndigoButton = styled(Button)`
${BaseButton}

&&{
    background:#1E3A8A;
    color:white;

    &:hover{
        background:#1D4ED8;
    }
}
`;

/* Reserved for attendance status */

export const GreenButton = styled(Button)`
${BaseButton}

&&{
    background:#1F3A2D;
    color:#D1FAE5;

    &:hover{
        background:#29513F;
    }
}
`;