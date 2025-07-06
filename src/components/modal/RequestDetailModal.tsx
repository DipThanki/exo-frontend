import { useTranslation } from "react-i18next";
import {
  FileVioletIcon,
  UsdGreenIcon,
  UsdOrangeIcon,
  UsdVioletIcon,
} from "../../icons";
import Modal from "../../lib/components/atoms/Modal";
import DashBoardCard from "../../lib/components/molecules/DashBoardCard";
import Typography from "../../lib/components/atoms/Typography";
import CreateRequestTable from "../table/CreateRequestTable.tsx";

export interface RequestAddress {
  country: string;
  providence: string;
  city: string;
  municipality: string;
}

export interface RequestEntity {
  label: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_rate: number;
  tax_amount: number;
  vat_included: number;
  financial_authority: string;
  status: string;
}

export interface AmountSummary {
  total_quantity: number;
  total_amount: number;
  total_tax: number;
  vat_included: number;
}

export interface RequestDetails {
  id: string;
  unique_number: string;
  status: string;
  project_id: string;
  request_letter: string;
  address: RequestAddress;
  entities: RequestEntity[];
  amount_summary: AmountSummary;
  tracks: any[]; // Use a specific interface if `tracks` has a defined shape
}

interface RequestDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  requestDetails: RequestDetails | any;
}
const RequestDetailModal = ({
  isOpen,
  onClose,
  requestDetails,
}: RequestDetailsProps) => {
  const { t } = useTranslation();
  const { total_quantity, total_amount, total_tax, vat_included } =
    requestDetails.amount_summary;
  return (
    <div className="w-fit">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isFullscreen={false}
        className="xl:max-w-[1200px] lg:max-w-[800px] max-w-[80dvw] mx-auto p-6 max-h-[500px]"
      >
        <div className="py-4">
          <Typography size="xl" weight="bold" className="text-secondary-100">
            {t("details")}
          </Typography>
          <div className="mt-5">
            <Typography
              size="base"
              weight="semibold"
              className="text-secondary-100"
            >
              {t("request_latter")}
            </Typography>
            <Typography size="sm" weight="normal" className="text-secondary-60">
              <div
                dangerouslySetInnerHTML={{
                  __html: requestDetails.request_letter,
                }}
              ></div>
            </Typography>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <DashBoardCard
              icon={<FileVioletIcon width={44} height={44} />}
              count={total_quantity || 0}
              title={t("total_quantity")}
            />
            <DashBoardCard
              icon={<UsdGreenIcon width={44} height={44} />}
              count={total_amount || 0}
              title={t("total_amount")}
            />
            <DashBoardCard
              icon={<UsdVioletIcon width={44} height={44} />}
              count={total_tax || 0}
              title={t("total_tax_amount")}
            />
            <DashBoardCard
              icon={<UsdOrangeIcon width={44} height={44} />}
              count={vat_included || 0}
              title={t("total_amount_with_tax")}
            />
          </div>
        </div>
        <div className="mt-3 md:mt-5 mb-2">
          <CreateRequestTable
            data={requestDetails.entities}
            showActions={false}
          />
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetailModal;
