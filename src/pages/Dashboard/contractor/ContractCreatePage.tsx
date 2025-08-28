import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "../../../layout/AppLayout";
import Stepper from "../../../components/common/Stepper";
import { useModal } from "../../../hooks/useModal";
import { ArrowLeftIcon, ArrowRightIconButton } from "../../../icons";
import Typography from "../../../lib/components/atoms/Typography";
import Button from "../../../lib/components/atoms/Button";
import ContractInfoForm from "../../../components/dashboard/contractor/ContractInfoForm";
import ContractReviewForm from "../../../components/dashboard/contractor/ContractReviewForm";
import CreateContractConfirmationModal from "../../../components/modal/CreateContractConfirmationModal";
import projectService from "../../../services/project.service";
import { UploadedFile } from "../../../components/common/UploadFile";
import { useLoading } from "../../../context/LoaderProvider";
import { useMutation } from "@tanstack/react-query";
import contractService from "../../../services/contract.service";
import moment from "moment";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
interface Address {
  id: string;
  country?: string;
  providence?: string;
  city?: string;
  municipality?: string;
}

export interface ContractReviewData {
  projectName: string;
  reference: string;
  projectAmount: string;
  projectCurrency: string;
  signedBy: string;
  position: string;
  beginDate: string;
  endDate: string;
  description: string;
  projectFiles: UploadedFile[];
  address: Address[];
  // projectManager: string;
  organization: string;
  amount: string;
  currency: string;
  dateOfSigning: string;
  contractFiles: UploadedFile[];
  place: string;
  contractReference: string;
  contractName: string;
}

const ContractReviewInitialValue = {
  projectName: "",
  reference: "",
  projectAmount: "",
  projectCurrency: "",
  signedBy: "",
  position: "",
  beginDate: "",
  endDate: "",
  description: "",
  projectFiles: [],
  address: [],
  // projectManager: "",
  organization: "",
  amount: "",
  currency: "",
  dateOfSigning: "",
  contractFiles: [],
  place: "",
  contractReference: "",
  contractName: "",
};

interface FormDataProps {
  signedBy: string;
  position: string;
  // projectManager: string,
  organization: string;
  amount: string;
  currency: string;
  dateOfSigning: string;
  contractFiles: UploadedFile[];
  place: string;
  reference: string;
  name: string;
}

const initialValue = {
  signedBy: "",
  position: "",
  // projectManager: "",
  organization: "",
  amount: "",
  currency: "USD",
  dateOfSigning: "",
  contractFiles: [],
  place: "",
  reference: "",
  name: "",
};

// Function to map backend error messages to translation keys
const getContractErrorTranslationKey = (errorMessage: string): string => {
  const normalizedError = errorMessage.toLowerCase();
  
  // Check for specific contract amount validation that exceeds project budget
  if (normalizedError.includes("contract amount") && normalizedError.includes("exceed") && normalizedError.includes("budget")) {
    return "contract_amount_validation_failed";
  }
  if (normalizedError.includes("total amount") && normalizedError.includes("exceed") && normalizedError.includes("budget")) {
    return "contract_amount_validation_failed";
  }
  if (normalizedError.includes("amount") && (normalizedError.includes("exceed") || normalizedError.includes("budget"))) {
    return "contract_amount_validation_failed";
  }
  
  if (normalizedError.includes("validation") || normalizedError.includes("invalid")) {
    return "contract_validation_error";
  }
  if (normalizedError.includes("already exists") || normalizedError.includes("duplicate")) {
    return "contract_already_exists";
  }
  if (normalizedError.includes("amount") && (normalizedError.includes("invalid") || normalizedError.includes("exceed"))) {
    return "contract_amount_invalid";
  }
  if (normalizedError.includes("date") && (normalizedError.includes("invalid") || normalizedError.includes("past"))) {
    return "contract_date_invalid";
  }
  if (normalizedError.includes("required") || normalizedError.includes("missing")) {
    return "required_fields_missing";
  }
  if (normalizedError.includes("file") || normalizedError.includes("upload")) {
    return "file_upload_error";
  }
  if (normalizedError.includes("reference")) {
    return "contract_already_exists";
  }
  
  // Default fallback
  return "contract_save_error";
};

const ContractCreatePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormDataProps>(initialValue);
  const [contractReview, setContractReview] = useState<ContractReviewData>(
    ContractReviewInitialValue
  );
  
  useEffect(() => {
    const resetFilesListener = () => {
      setFormData(prev => ({ ...prev, contractFiles: [] }));
      setContractReview(prev => ({ ...prev, contractFiles: [] }));
    };

    window.addEventListener('form-reset', resetFilesListener);

    return () => {
      window.removeEventListener('form-reset', resetFilesListener);
    };
  }, []);
  const [editProjectId, setEditProjectId] = useState("");

  const { projectId, contractId } = useParams();
  const [newContractId, setNewContractId] = useState();
  const { loading, setLoading } = useLoading();

  const steps = [
    { id: 1, title: t("contract_info") },
    { id: 2, title: t("review") },
  ];

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleFormSubmit = (values: any) => {
    setContractReview((preve) => ({ 
      ...preve, 
      ...values,
      contractReference: values.reference,
      contractName: values.name
    }));
    setFormData(values);
    setCurrentStep(1);
  };

  const contractCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const files = data.contractFiles;
      const filesData = Array.isArray(files) ? files : files ? [files] : [];

      const payload = new FormData();
      payload.append("signed_by", data.signedBy);
      payload.append("position", data.position);
      payload.append("currency", data.currency);
      payload.append("amount", data.amount);
      payload.append("organization", data.organization);
      payload.append("place", data.place);
      payload.append(
        "date_of_signing",
        moment(data.dateOfSigning, ["DD-MM-YYYY", "YYYY-MM-DD"], true).format("YYYY-MM-DD")
      );
      payload.append(
        "document_ids",
        filesData.map((file: any) => file.id).join(",")
      );
      // Add required fields
      payload.append("reference", data.reference);
      payload.append("name", data.name);
      if (projectId) {
        payload.append("project_id", projectId);
      }
      if (contractId && editProjectId) {
        payload.append("project_id", editProjectId);
        payload.append("contract_id", contractId);
      }
      const response = await contractService.creteContract(payload);
      setNewContractId(response.data.data.id);
      return response.data;
    },
    onSuccess: async () => {
      openModal();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: any }>;
      console.error('Contract creation error:', error);
      
      let errorMessage = "contract_creation_failed";
      
      // Handle 422 validation errors specifically
      if (axiosError?.response?.status === 422) {
        const backendMessage = 
          axiosError?.response?.data?.message ||
          axiosError?.response?.data?.error ||
          "Validation failed";
        
        errorMessage = getContractErrorTranslationKey(backendMessage);
        
        // Check if contractId exists for edit mode
        if (contractId) {
          errorMessage = "contract_update_failed";
        }
      } else {
        // Handle other status codes
        if (axiosError?.response?.data?.message) {
          errorMessage = getContractErrorTranslationKey(axiosError.response.data.message);
        }
      }
      
      // Show translated error message
      toast.error(t(errorMessage));
    },
  });

  const handleFinalSubmit = () => {
    contractCreateMutation.mutate(formData);
    // openModal();
  };

  const fetchProject = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await projectService.getProjectDetails(projectId!);
      const project = data.data;
      setContractReview((preve) => ({
        ...preve,
        projectAmount: project.amount,
        projectName: project.name,
        currency: project.currency,
        projectCurrency: project.currency,
        beginDate: project.begin_date,
        endDate: project.end_date,
        description: project.description,
        projectFiles: project.documents,
        reference: project.reference,
        address: project.address.map((address: Address, index: number) => ({
          id: index + 1,
          city: address.city,
          providence: address.providence,
          municipality: address.municipality,
          country: address.country,
        })),
      }));

      // Set the project currency in formData to fix the currency selection
      setFormData((prev) => ({
        ...prev,
        currency: project.currency,
      }));
      return project;
    } catch (err: any) {
      console.error(err, "erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, t]);

  const getContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      setLoading(true);
      const response = await contractService.getContractDetails({
        contract_id: contractId,
      });
      if (response.data.status === 200) {
        const contractData: {
          project_id: string;
          signed_by: string;
          position: string;
          currency: string;
          amount: string;
          organization: string;
          place: string;
          date_of_signing: string;
          documents: UploadedFile[] | [];
          reference?: string;
          name?: string;
        } = response.data.data;
        setEditProjectId(contractData.project_id);
        fetchProject(contractData.project_id);

        console.log(contractData, "contract data");
        

        setFormData((prev: FormDataProps) => ({
          ...prev,
          amount: parseFloat(contractData.amount).toString(),
          contractFiles: contractData.documents || [],
          currency: contractData.currency,
          dateOfSigning: contractData.date_of_signing,
          organization: contractData.organization,
          place: contractData.place,
          signedBy: contractData.signed_by,
          position: contractData.position,
          reference: contractData.reference || "",
          name: contractData.name || "",
        }));
      }
    },
    onError: async (error) => {
      setLoading(true);
      console.error(error);
    },
  });

  useEffect(() => {
    if (contractId) {
      getContractMutation.mutate(contractId);
    }
  }, [contractId]);

  return (
    <AppLayout>
      <div className="bg-secondary-5 h-full p-4 md:p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-lg overflow-hidden bg-white shadow-md border border-gray-100">
            <div className="h-1 w-full bg-primary-150"></div>
            <div className="p-4 md:p-6">
              <div
                className="flex items-center gap-2 cursor-pointer mb-2"
                onClick={() => navigate("/project-home")}
              >
                <ArrowLeftIcon
                  width={16}
                  height={16}
                  className="text-primary-150"
                />
                <Typography
                  size="base"
                  weight="semibold"
                  className="text-primary-150"
                >
                  {t("back_to_dashboard")}
                </Typography>
              </div>

              <Typography
                size="xl"
                weight="bold"
                className="text-secondary-100"
              >
                {t("create_contract")}
              </Typography>
            </div>
            <div className="h-[1px] w-full bg-gray-200"></div>
            <div className="p-4 md:p-6">
              <Stepper
                variant="outline"
                steps={steps}
                currentStep={currentStep}
                onStepClick={handleStepClick}
              />
              {currentStep === 0 && !loading && (
                <ContractInfoForm
                  initialValues={formData}
                  onSubmit={handleFormSubmit}
                  isProjectSelected={!!projectId || !!editProjectId}
                  projectAmount={contractReview.projectAmount}
                />
              )}

              {currentStep === 1 && (
                <>
                  <ContractReviewForm projectData={contractReview} />
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      loading={contractCreateMutation.isPending}
                      onClick={handleFinalSubmit}
                      //   form="project-form"
                      className="px-6 py-3 bg-primary-150 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-primary-200 w-full md:w-auto"
                    >
                      {t("submit")}
                      <ArrowRightIconButton
                        width={18}
                        height={18}
                        className="text-white"
                      />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <CreateContractConfirmationModal
          isOpen={isOpen}
          onClose={closeModal}
          projectId={`${projectId || editProjectId}/${newContractId}`}
        />
      </div>
    </AppLayout>
  );
};

export default ContractCreatePage;
