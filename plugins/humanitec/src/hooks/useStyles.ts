import {
  makeStyles
} from '@material-ui/core';

export const useStyles = makeStyles(styles => {
  return {
    cardClass: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100% - 10px)', // for pages without content header
      marginBottom: '10px',
    },
    cardHeader: {
      paddingBottom: styles.spacing(1)
    },
    gridItemCardContent: {
      flex: 1,
    },
    environmentsContainer: {
      display: 'flex',
      flexDirection: 'row'
    },
    environmentCard: {
      minWidth: "12em",
      borderRadius: 5,
      borderColor: styles.palette.grey[600],
      borderStyle: 'solid',
      borderWidth: 1,
      padding: styles.spacing(1),
      marginRight: styles.spacing(1)
    },
    environmentTitleContainer: {
      display: 'flex',
      flexDirection: 'row'
    },
    environmentName: {
      fontSize: "1.1em",
      flexGrow: 1,
      paddingRight: styles.spacing(1)
    },
    environmentButton: {
      padding: 1
    },
    environmentId: {
      fontSize: "0.9em"
    },
    deploymentStatus: {
      fontSize: "0.75em"
    },
    deploymentFailedStatus: {
      color: styles.palette.error.main
    },
    deploymentSucceededStatus: {
      color: styles.palette.success.main
    },
    deploymentInProgressStatus: {
      color: styles.palette.info.main
    },
    deploymentPendingStatus: {
      color: styles.palette.primary.main
    },
    deploymentNeverDeployedStatus: {
      color: styles.palette.text.secondary
    }
  }
});